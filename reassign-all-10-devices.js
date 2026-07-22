const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, UpdateCommand } = require("@aws-sdk/lib-dynamodb");

const client = new DynamoDBClient({ region: "us-east-2" });
const docClient = DynamoDBDocumentClient.from(client);

const deviceIds = [
  "862605278000311",
  "862605278000312",
  "862605278000313",
  "862605278000314",
  "862605278000315",
  "862605278000316",
  "862605278000317",
  "862605278000318",
  "862605278000319",
  "862605278000320"
];

async function updateDeviceClaims() {
  console.log("🔄 Force-assigning all 10 device LATEST records to clientId = 'GLOBAL_ADMIN'...\n");

  for (const deviceId of deviceIds) {
    try {
      await docClient.send(new UpdateCommand({
        TableName: "AssetTrackerData",
        Key: {
          deviceId: deviceId,
          timestamp: "LATEST"
        },
        UpdateExpression: "SET clientId = :cid",
        ExpressionAttributeValues: {
          ":cid": "GLOBAL_ADMIN"
        }
      }));
      console.log(`✅ Assigned device ${deviceId} (LATEST) -> GLOBAL_ADMIN`);
    } catch (err) {
      console.error(`❌ Failed to update device ${deviceId}:`, err.message);
    }
  }

  console.log("\n🎉 Re-assignment complete! All 10 devices are assigned to GLOBAL_ADMIN.");
}

updateDeviceClaims();
