require "java"

module Fits
	include_package "fits.sample"
end

describe "Book" do
	context "初期状態" do
		before do
			@b = Fits::Book.new
		end

		it "comments は nil ではない" do
			@b.comments.should_not be_nil
		end

		it "comments は空" do
			@b.comments.size.should == 0
		end
	end

	context "Comment を追加" do
		before do
			@b = Fits::Book.new
			@b.comments.add(Fits::Comment.new)
		end

		it "Comment が追加されている" do
			@b.comments.size.should == 1
		end
	end
end
