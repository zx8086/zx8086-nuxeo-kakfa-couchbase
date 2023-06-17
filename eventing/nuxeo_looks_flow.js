function OnUpdate(doc, meta) {

    function consoleAndLog(message) {
      var logMessage = meta.id + ": " + message;
      console.log(logMessage);
      log(logMessage);
    }
    
    function getIsDeletedStatus(status) {
        return status === "Created" || status === "Updated" ? false : true;
    }
  
    consoleAndLog(`Start - Processing event with Nuxeo ID: ${meta.id}`);
  
    try {
      var nuxeoEvent = doc;
      // var nuxeoId = nuxeoEvent.Nuxeo_ID;
      var key = `LOOK_${nuxeoEvent.Brand}_${nuxeoEvent.SeasonName}_${nuxeoEvent.DivisionName}_${nuxeoEvent.MarketLaunchContentTyp}_${nuxeoEvent.Nuxeo_ID}`;
  
      var existingDoc = bkt_dst[key];
  
      if (existingDoc) {
  
        consoleAndLog(`   Check - Look Document already exists with key: ${key}`);
  
        var isDeleted = nuxeoEvent.Status === "Created" || nuxeoEvent.Status === "Updated" ? false : true;
  
        existingDoc.assetUrl = nuxeoEvent.Scene7;
        existingDoc.brand = nuxeoEvent.Brand;
        existingDoc.channels = [`SEASON_${nuxeoEvent.DivisionName}_${nuxeoEvent.SeasonName}`];
        existingDoc.createdOnSourceSystem = new Date(nuxeoEvent.Created * 1000).toISOString();
        existingDoc.DivisionName = nuxeoEvent.DivisionName;
        existingDoc.isDeleted = getIsDeletedStatus(nuxeoEvent.Status);
        existingDoc.lookType = nuxeoEvent.MarketLaunchContentTyp;
        existingDoc.modifiedOnSourceSystem = new Date(nuxeoEvent.Modified * 1000).toISOString();
        existingDoc.position = nuxeoEvent.Position;
        existingDoc.processedOn = new Date(nuxeoEvent.Modified * 1000).toISOString();
        existingDoc.relatedStyles = Object.values(nuxeoEvent.RelatedStyles);
        existingDoc.styleSeasonCodeAFS = nuxeoEvent.SeasonName;
        existingDoc.tag = nuxeoEvent.FreeTag;
        existingDoc.title = nuxeoEvent.Title;
        existingDoc.modifiedOn = new Date().toISOString();
  
        bkt_dst[key] = existingDoc;
  
        consoleAndLog(`   Update - Look Document updated with key: ${key}`);
  
      } else {
  
        var lookId = `LOOK_${nuxeoEvent.Brand}_${nuxeoEvent.SeasonName}_${nuxeoEvent.DivisionName}_${nuxeoEvent.MarketLaunchContentTyp}`;
        var currentTime = new Date();
        var isDeleted = getIsDeletedStatus(nuxeoEvent.Status);
  
        consoleAndLog(`   Check - Look Document does not exist`);
  
        var newDoc = {
          assetUrl: nuxeoEvent.Scene7,
          brand: nuxeoEvent.Brand,
          channels: [`SEASON_${nuxeoEvent.DivisionName}_${nuxeoEvent.SeasonName}`],
          createdOnSourceSystem: new Date(nuxeoEvent.Created * 1000).toISOString(),
          deliveryName: null,
          description: null,
          divisionCode: nuxeoEvent.DivisionName,
          gender: null,
          isDeleted: isDeleted,
          lookId: lookId,
          lookType: nuxeoEvent.MarketLaunchContentTyp,
          modifiedOnSourceSystem: new Date(nuxeoEvent.Modified * 1000).toISOString(),
          nuxeoId: nuxeoEvent.Nuxeo_ID,
          position: nuxeoEvent.Position,
          processedOn: new Date(nuxeoEvent.Modified * 1000).toISOString(),
          relatedStyles: nuxeoEvent.RelatedStyles,
          sourceSystem: "nuxeo",
          styleSeasonCodeAFS: nuxeoEvent.SeasonName,
          tag: nuxeoEvent.FreeTag,
          title: nuxeoEvent.Title,
          trend: null,
          createdOn: currentTime,
          modifiedOn: currentTime
        };
  
        bkt_dst[key] = newDoc;
  
        consoleAndLog(`   Create - New Look Document with key: ${key}`);
  
      }
  
      // var prcBktKey = key + "_" + meta.id;
      bkt_prc[key] = doc;
  
      // delete bkt_src[meta.id];
  
      consoleAndLog(`End - Processed event with Nuxeo ID: ${meta.id}`);
  
    } catch (error) {
  
      consoleAndLog(`Error: ${error.message}`);
  
    }
  }
  
  function OnDelete(meta, options) {
    log("Doc deleted/expired", meta.id);
  }
  