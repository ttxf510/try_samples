package fits.sample;

import org.springframework.stereotype.Component;
import org.springframework.beans.factory.annotation.Autowired;

import com.mongodb.Mongo;
import com.mongodb.MongoURI;
import com.mongodb.DBCollection;
import com.mongodb.DBObject;
import com.mongodb.util.JSON;

@Component
public class MongoDbOperations implements DbOperations {

	@Autowired
	private Mongo mongo;

	private String dbName;

	public void setDbName(String dbName) {
		this.dbName = dbName;
	}

	public <T> T get(String key, Class<T> cls) {
		DBCollection col = mongo.getDB(dbName).getCollection(key);
		String json = JSON.serialize(col.findOne());

		return net.arnx.jsonic.JSON.decode(json, cls);
	}

	public <T> void put(String key, T obj) {
		DBCollection col = mongo.getDB(dbName).getCollection(key);
		col.drop();

		String json = net.arnx.jsonic.JSON.encode(obj);
		col.insert((DBObject)JSON.parse(json));
	}

}
