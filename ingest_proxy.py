import boto3
import json

# Initialize DynamoDB
dynamodb = boto3.resource("dynamodb", region_name="us-east-2")
table = dynamodb.Table("AssetTrackerData")

# Simple Mapping: Device ID to Client ID
device_to_client_map = {
    "TestTracker_01": "Client_A",
    "TestTracker_02": "Client_B"
}

def process_ping(data):
    device_id = data.get("deviceId")
    
    # Add the clientId automatically
    data['clientId'] = device_to_client_map.get(device_id, "Unknown_Client")
    
    # Save to DynamoDB
    table.put_item(Item=data)
    print(f"Saved {device_id} for {data['clientId']}")

# Test run
example_payload = {"deviceId": "TestTracker_01", "status": "active", "battery": 98, "timestamp": "2026-06-22T14:30:00Z"}
process_ping(example_payload)
