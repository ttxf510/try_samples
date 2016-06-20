
'use strict';

const fs = require('fs');
const ref = require('ref');
const ArrayType = require('ref-array');
const ffi = require('ffi');

const CL_DEVICE_TYPE_DEFAULT = 1;

const CL_MEM_READ_WRITE = (1 << 0);
const CL_MEM_WRITE_ONLY = (1 << 1);
const CL_MEM_READ_ONLY = (1 << 2);
const CL_MEM_USE_HOST_PTR = (1 << 3);
const CL_MEM_ALLOC_HOST_PTR = (1 << 4);
const CL_MEM_COPY_HOST_PTR = (1 << 5);

const intPtr = ref.refType(ref.types.int32);
const uintPtr = ref.refType(ref.types.uint32);
const uintPtrPtr = ref.refType(uintPtr);
const sizeTPtr = ref.refType('size_t');
const StringArray = ArrayType('string');

const openCl = ffi.Library('OpenCL', {
	'clGetPlatformIDs': ['int', ['uint', uintPtrPtr, uintPtr]],
	'clGetDeviceIDs': ['int', ['uint', 'uint', 'uint', uintPtrPtr, uintPtr]],
	'clCreateContext': ['pointer', ['pointer', 'uint', uintPtrPtr, 'pointer', 'pointer', intPtr]],
	'clReleaseContext': ['int', ['pointer']],
	'clCreateProgramWithSource': ['pointer', ['pointer', 'uint', StringArray, sizeTPtr, intPtr]],
	'clBuildProgram': ['int', ['pointer', 'uint', 'pointer', 'string', 'pointer', 'pointer']],
	'clReleaseProgram': ['int', ['pointer']],
	'clCreateKernel': ['pointer', ['pointer', 'string', intPtr]],
	'clReleaseKernel': ['int', ['pointer']],
	'clCreateBuffer': ['pointer', ['pointer', 'uint', 'size_t', 'pointer', intPtr]],
	'clReleaseMemObject': ['int', ['pointer']],
	'clSetKernelArg': ['int', ['pointer', 'uint', 'size_t', 'pointer']],
	'clCreateCommandQueue': ['pointer', ['pointer', 'uint', 'ulong', intPtr]],
	'clReleaseCommandQueue': ['int', ['pointer']],
	'clEnqueueTask': ['int', ['pointer', 'pointer', 'uint', 'pointer', 'pointer']],
	'clEnqueueReadBuffer': ['int', ['pointer', 'pointer', 'bool', 'size_t', 'size_t', 'pointer', 'uint', 'pointer', 'pointer']]
});

const dataTypeSize = 4;
const data = [1.1, 2.2, 3.3];

const code = fs.readFileSync(process.argv[2]);

let platformIdsPtr = ref.alloc(uintPtrPtr);

let res = openCl.clGetPlatformIDs(1, platformIdsPtr, null);

if (res != 0) {
	throw new Error(`clGetPlatformIDs Error: ${res}`);
}

let platformId = uintPtrPtr.get(platformIdsPtr);

let deviceIdsPtr = ref.alloc(uintPtrPtr);

res = openCl.clGetDeviceIDs(platformId, CL_DEVICE_TYPE_DEFAULT, 1, deviceIdsPtr, null);

if (res != 0) {
	throw new Error(`clGetDeviceIDs Error: ${res}`);
}

let errPtr = ref.alloc(intPtr);

let ctx = openCl.clCreateContext(null, 1, deviceIdsPtr, null, null, errPtr)

let errCode = intPtr.get(errPtr);

if (errCode != 0) {
	throw new Error(`clCreateContext Error: ${errCode}`);
}

let codeArray = new StringArray([code.toString()]);

let program = openCl.clCreateProgramWithSource(ctx, 1, codeArray, null, errPtr);
errCode = intPtr.get(errPtr);

if (errCode != 0) {
	throw new Error(`clCreateProgramWithSource Error: ${errCode}`);
}

errCode = openCl.clBuildProgram(program, 1, deviceIdsPtr, null, null, null)

if (errCode != 0) {
	throw new Error(`clBuildProgram Error: ${errCode}`);
}

let kernel = openCl.clCreateKernel(program, 'square', errPtr);

errCode = intPtr.get(errPtr);

if (errCode != 0) {
	throw new Error(`clCreateKernel Error: ${errCode}`);
}

let bufSize = dataTypeSize * data.length;

let inBuf = Buffer.alloc(bufSize);
data.forEach((v, i) => inBuf.writeFloatLE(v, dataTypeSize * i));

let inClBuf = openCl.clCreateBuffer(ctx, CL_MEM_READ_ONLY | CL_MEM_COPY_HOST_PTR, inBuf.length, inBuf, errPtr);

errCode = intPtr.get(errPtr);

if (errCode != 0) {
	throw new Error(`clCreateBuffer In Error: ${errCode}`);
}

let outClBuf = openCl.clCreateBuffer(ctx, CL_MEM_WRITE_ONLY, bufSize, null, errPtr);

errCode = intPtr.get(errPtr);

if (errCode != 0) {
	throw new Error(`clCreateBuffer Out Error: ${errCode}`);
}

errCode = openCl.clSetKernelArg(kernel, 0, inBuf.length, inClBuf.ref());

if (errCode != 0) {
	throw new Error(`clSetKernelArg 0 Error: ${errCode}`);
}

errCode = openCl.clSetKernelArg(kernel, 1, bufSize, outClBuf.ref());

if (errCode != 0) {
	throw new Error(`clSetKernelArg 1 Error: ${errCode}`);
}

let ct = new Buffer(4);
ct.writeUInt32LE(data.length);

errCode = openCl.clSetKernelArg(kernel, 2, ct.length, ct);

if (errCode != 0) {
	throw new Error(`clSetKernelArg 2 Error: ${errCode}`);
}

let deviceId = uintPtrPtr.get(deviceIdsPtr);

let queue = openCl.clCreateCommandQueue(ctx, deviceId, 0, errPtr);

errCode = intPtr.get(errPtr);

if (errCode != 0) {
	throw new Error(`clCreateCommandQueue Error: ${errCode}`);
}

errCode = openCl.clEnqueueTask(queue, kernel, 0, null, null);

if (errCode != 0) {
	throw new Error(`clEnqueueTask Error: ${errCode}`);
}

let resBuf = Buffer.alloc(bufSize);

errCode = openCl.clEnqueueReadBuffer(queue, outClBuf, true, 0, bufSize, resBuf, 0, null, null);

if (errCode != 0) {
	throw new Error(`clEnqueueReadBuffer Error: ${errCode}`);
}

console.log(resBuf.readFloatLE());
console.log(resBuf.readFloatLE(4));
console.log(resBuf.readFloatLE(8));

openCl.clReleaseMemObject(outClBuf);
openCl.clReleaseMemObject(inClBuf);

openCl.clReleaseKernel(kernel);
openCl.clReleaseProgram(program);

openCl.clReleaseCommandQueue(queue);
openCl.clReleaseContext(ctx);