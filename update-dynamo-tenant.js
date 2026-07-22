const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, ScanCommand, UpdateCommand } = require("@aws-sdk/lib-dynamodb");

// Uses local AWS credentials / environment config
const client = new DynamoDBClient({ region: "us-east-2" });
const docClient = DynamoDBDocumentClient.from(client);

async function updateAllTenants() {
  console.log("🔍 Scanning BeverageInventoryData table...");
  try {
    const scanResult = await docClient.send(new ScanCommand({
      TableName: "BeverageInventoryData"
    }));

    const items = scanResult.Items || [];
    console.log(`Found ${items.length} items. Updating clientId to GLOBAL_ADMIN...`);

    let updatedCount = 0;
    for (const item of items) {
      if (item.clientId !== "GLOBAL_ADMIN") {
        await docClient.send(new UpdateCommand({
          TableName: "BeverageInventoryData",
          Key: { barcode: item.barcode, lotNumber: item.lotNumber },
          UpdateExpression: "SET clientId = :cid",
          ExpressionAttributeValues: { ":cid": "GLOBAL_ADMIN" }
        }));
        updatedCount++;
      }
    }

    console.log(`✅ Successfully updated ${updatedCount} items to GLOBAL_ADMIN!`);
  } catch (err) {
    console.error("❌ Error updating DynamoDB:", err.message);
  }
}

updateAllTenants();
