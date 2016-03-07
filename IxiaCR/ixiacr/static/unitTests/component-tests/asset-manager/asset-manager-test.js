test("Asset Manager is Created", function(){
	var assetManager = new AssetManager();
	
	notEqual(assetManager, undefined);
	equal(assetManager.successCount, 0);
	equal(assetManager.errorCount, 0);
	notEqual(assetManager.cache, undefined);
	notEqual(assetManager.downloadQueue, undefined);
});

test("Asset Manager queues download", function(){
	var assetManager = new AssetManager();
	var assetPath = "../../assets/spirent-logo.png";
	
	assetManager.queueDownload(assetPath);
	
	equal(assetManager.downloadQueue[0], assetPath);
});

test("Asset Manager does not queue same download", function(){
	var assetManager = new AssetManager();
	var assetPath = "../../assets/spirent-logo.png";
	
	assetManager.queueDownload(assetPath);
	assetManager.queueDownload(assetPath);
	
	equal(assetManager.downloadQueue.length, 1);
});

test("Asset Manager reports Done (all success)", function(){
	var assetManager = new AssetManager();
	
	assetManager.queueDownload("../../assets/spirent-logo.png");
	assetManager.queueDownload("../../assets/spirent-logo2.png");
	
	assetManager.successCount = 2;
	
	ok(assetManager.isDone());
});

test("Asset Manager reports Done (all fail)", function(){
	var assetManager = new AssetManager();
	
	assetManager.queueDownload("../../assets/spirent-logo.png");
	assetManager.queueDownload("../../assets/spirent-logo2.png");
	
	assetManager.errorCount = 2;
	
	ok(assetManager.isDone());
});

test("Asset Manager reports Done (some succeed, some fail)", function(){
	var assetManager = new AssetManager();
	
	assetManager.queueDownload("../../assets/spirent-logo.png");
	assetManager.queueDownload("../../assets/spirent-logo2.png");
	
	assetManager.successCount = 1;
	assetManager.errorCount = 1;
	
	ok(assetManager.isDone());
});

asyncTest("Asset Manager downloads all (success)", function(){
	var assetManager = new AssetManager();
	var assetPath = "../../assets/spirent-logo.png";
	
	expect(2);
	
	assetManager.queueDownload(assetPath);

	assetManager.downloadAll(function(){
		equal(assetManager.successCount, 1);
		notEqual(assetManager.cache[assetPath].height, 0);
		start();
	});
});

asyncTest("Asset Manager downloads all (fail)", function(){
	var assetManager = new AssetManager();
	var assetPath = "../../assets/not-found.png";
	
	expect(2);
	
	assetManager.queueDownload(assetPath);

	assetManager.downloadAll(function(){
		equal(assetManager.errorCount, 1);
		equal(assetManager.cache[assetPath].height, 0);
		start();
	});
});

test("Asset Manager gets asset", function(){
	var assetManager = new AssetManager();
	var assetPath = "../../assets/not-found.png";
	
	var img = new Image();
	img.src = assetPath;
	
	assetManager.cache[assetPath] = img;
	
	equal(assetManager.getAsset(assetPath), assetManager.cache[assetPath]);
});
