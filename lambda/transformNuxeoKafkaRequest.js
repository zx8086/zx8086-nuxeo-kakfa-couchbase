const axios = require("axios");

const REST_PROXY = "http://localhost:8082/topics";

const http = axios.create({
  baseURL: REST_PROXY,
  headers: { "Content-Type": "application/vnd.kafka.json.v2+json" },
  timeout: 10000, // 10 seconds
});

const productImageTopicUrl = "/gdam-products-linebook";
// const lookTopicUrl = "/T_PRIVATE_NUXEO_EVENT_LOOK";
const lookTopicUrl = "/T_PRIVATE_NUXEO_EVENT_LOOK_AVRO";
const nullableFieldNames = [
  "DeliveryBatch",
  "Description",
  "Trend",
  "FreeTag",
  "GenderMarketLaunch",
  "RelatedStyles",
];

function getTopicUrl(kafkaRequestBody) {
  return kafkaRequestBody.records[0].value["Nuxeo_ID"]
    ? lookTopicUrl
    : productImageTopicUrl;
}

function processNullableFields(kafkaRequestBody) {
  if (kafkaRequestBody.records[0].value["Nuxeo_ID"]) {
    nullableFieldNames.forEach((name) => {
      if (!kafkaRequestBody.records[0].value[name]) {
        kafkaRequestBody.records[0].value[name] = null;
      }
    });
  }
}

exports.handler = async (event) => {
  console.info("Received event", event);

  try {
    const eventBody = JSON.stringify(event); // Convert event object to JSON string
    const isJSON = isJSONString(eventBody);

    if (!isJSON) {
      throw new Error("Invalid JSON in the request body");
    }

    const parsedEvent = JSON.parse(eventBody); // Parse the event JSON string

    const kafkaRequestBody = {
      records: [
        {
          value: parsedEvent,
        },
      ],
    };
    processNullableFields(kafkaRequestBody);

    console.info("kafkaRequestBody", JSON.stringify(kafkaRequestBody));

    console.info("KAFKA REST PROXY - Request", event);
    const response = await http.post(getTopicUrl(kafkaRequestBody), kafkaRequestBody);

    if (response.status === 200) {
      if (response.data.error_code) {
        throw new Error(response.data.message);
      }
    } else {
      throw new Error("Unexpected response from the server");
    }

    console.info("KAFKA REST PROXY - Response", response.data);

    return createResponse(200, "200 OK", "");
  } catch (err) {
    console.error(err);
    console.info("Error happened");

    let errorMessage = err.message;
    if (err.response && err.response.data && err.response.data.message) {
      errorMessage = err.response.data.message;
    }

    return createResponse(500, "500 ERROR", errorMessage);
  }
};

function isJSONString(str) {
  try {
    JSON.parse(str);
    return true;
  } catch {
    return false;
  }
}

function createResponse(statusCode, statusDescription, body) {
  if (statusCode >= 400 && body) {
    body = JSON.stringify(body); 
  }

  return {
    statusCode,
    statusDescription,
    isBase64Encoded: false,
    headers: {
      "Content-Type": "text/html",
    },
    body,
  };
}

const currentTimestamp = Math.floor(Date.now() / 1000); 

// Generate the Nuxeo event for a PVH Look
const event = {
  "Status": "Updated",
  "Nuxeo_ID": "956d897f-1e0d-49b4-b71e-53fc5221b955",
  "Modified": currentTimestamp,
  "DivisionName": "62",
  "SeasonName": "C41",
  "Position": 2,
  "Title": "Commercial Look 1",
  "MarketLaunchContentTyp": 1,
  "RelatedStyles": [
    "OPTION_62_C41_J20J223112YAF",
    "OPTION_62_C41_J20J223112000"
  ],
  "Created": currentTimestamp,
  "Scene7": "http://s7g10.scene7.com/is/image/TommyHilfigerEU/SP24_CKJ_CL_W_COL_SINGLE_LOOK22_02",
  "Brand": "CK",
  "FreeTag": "Single Images - Women - Commercial Look - 1",
  "Asset Type": "market_launch_content"
};

exports.handler(event); 

