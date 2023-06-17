function OnUpdate(doc, meta) {
    // Action-1: Generate/update 'createdOn' (if not exist) and 'modifiedOn' fields with the current time`.
    log(`Document to update : `, meta.id);
    var currentTime = getCurrentTime();
    if (!("createdOn" in doc)) {
        doc["createdOn"] = currentTime;
    }
    doc["modifiedOn"] = currentTime;
    brads_col[meta.id] = doc;
    log(`Doc ${meta.id}: after modifiedOn/createdOn update: `, brads_col[meta.id]);

    // Action-2: Sending notification to kafka notification-topic
    log(`Doc ${meta.id}: was created/updated, sending notification to topic: ${topicName}`);
    let response = sendNotification(meta.id);
    if (response && response.status === 200) {
        log(`Doc ${meta.id}: cURL POST notification sent - response.status: ${response.status}`);
    } else if (response && response.status !== 200) {
        log(`Doc ${meta.id}: cURL POST notification failed - response: `, response);
        saveRetryNotificationDoc(meta.id);
    }
}

function sendNotification(bradsId) {
    try {
        let request = {
            path: `/topics/${topicName}`,
            headers: {
                'Content-Type': 'application/vnd.kafka.json.v2+json',
                'Accept': 'application/vnd.kafka.v2+json, application/vnd.kafka+json, application/json'
            },
            body: {
                "records": [
                    {
                        "key": bradsId,
                        "value": {
                            "DATA_ID": bradsId,
                            "MSG_TYPE": "MASTER_SYSTEM_UPDATE",
                            "ENTITY_TYPE": "BRANDS_DIVISIONS"
                        }
                    }
                ]
            }
        };
        return curl("POST", kafkaRestProxyURL, request);
    } catch (e) {
        log(`Doc ${bradsId}: ERROR sending notification - cURL POST request exception: `, e);
        saveRetryNotificationDoc(bradsId);
    }
}

function saveRetryNotificationDoc(bradsId) {
    let retryNotificationDoc = notifications_retry_col[bradsId];
    if (retryNotificationDoc) {
        retryNotificationDoc.lastAttemptAt = Date.now();
        retryNotificationDoc.failedAttempts = ++retryNotificationDoc.failedAttempts;
    } else {
        retryNotificationDoc = {
            "bradsId": bradsId,
            "failedAttempts": 1,
            "firstAttemptAt": Date.now(),
            "lastAttemptAt": Date.now()
        };
    }
    notifications_retry_col[bradsId] = retryNotificationDoc;
}

function getCurrentTime() {
    var date = new Date;
    // Format date in the format: YYYY-MM-DD hh:mm:ss.SSS
    var formattedDate = [date.getUTCFullYear(),
            getTwoDigitFormat(date.getUTCMonth(), 1),
            getTwoDigitFormat(date.getUTCDate(), 0)
        ]
            .join('-') + ' ' + [getTwoDigitFormat(date.getUTCHours(), 0),
            getTwoDigitFormat(date.getUTCMinutes(), 0),
            getTwoDigitFormat(date.getUTCSeconds(), 0)
        ].join(':') + '.' +
        date.getUTCMilliseconds();

    return formattedDate;
}

function getTwoDigitFormat(value, addBy) {
    return ("0" + (value + addBy)).slice(-2);
}