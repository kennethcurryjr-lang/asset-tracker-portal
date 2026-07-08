import re

with open('src/Inventory.js', 'r') as f:
    content = f.read()

# 1. Append 25 new flavors to initialMockData
old_end = 'zone: "Dry Aisle C" }\n];'
new_items = """,
  { barcode: "082123456801", lotNumber: "LOT-2026-10", expiryDate: "2027-01-15", vendorEmail: "supply@madrinas.com", brand: "Madrinas Coffee", flavor: "Mocha Cold Brew", type: "24-Can Case", quantity: 410, zone: "Dry Aisle C" },
  { barcode: "082123456802", lotNumber: "LOT-2026-11", expiryDate: "2027-02-20", vendorEmail: "orders@citrussprings.com", brand: "Citrus Springs", flavor: "Peach Mango Tea", type: "3G Bag-in-Box", quantity: 150, zone: "Cooler Bay-02" },
  { barcode: "082123456803", lotNumber: "LOT-2026-12", expiryDate: "2026-12-01", vendorEmail: "distro@twistedbranch.com", brand: "Twisted Branch", flavor: "Strawberry Lemonade", type: "3G Bag-in-Box", quantity: 220, zone: "Dry Aisle B" },
  { barcode: "082123456804", lotNumber: "LOT-2026-13", expiryDate: "2027-04-10", vendorEmail: "wholesale@coolattitudes.com", brand: "Cool Attitudes", flavor: "Pina Colada Mixer", type: "1G Jug Case", quantity: 80, zone: "Dry Aisle A" },
  { barcode: "082123456805", lotNumber: "LOT-2026-14", expiryDate: "2027-01-05", vendorEmail: "supply@madrinas.com", brand: "Madrinas Coffee", flavor: "Caramel Cold Brew", type: "24-Can Case", quantity: 340, zone: "Dry Aisle C" },
  { barcode: "082123456806", lotNumber: "LOT-2026-15", expiryDate: "2026-11-15", vendorEmail: "orders@citrussprings.com", brand: "Citrus Springs", flavor: "Cranberry Juice Blend", type: "3G Bag-in-Box", quantity: 95, zone: "Cooler Bay-01" },
  { barcode: "082123456807", lotNumber: "LOT-2026-16", expiryDate: "2027-03-22", vendorEmail: "distro@twistedbranch.com", brand: "Twisted Branch", flavor: "Sweet Tea Base", type: "3G Bag-in-Box", quantity: 400, zone: "Dry Aisle B" },
  { barcode: "082123456808", lotNumber: "LOT-2026-17", expiryDate: "2026-09-30", vendorEmail: "wholesale@coolattitudes.com", brand: "Cool Attitudes", flavor: "Strawberry Daiquiri", type: "1G Jug Case", quantity: 25, zone: "Dry Aisle A" },
  { barcode: "082123456809", lotNumber: "LOT-2026-18", expiryDate: "2027-05-11", vendorEmail: "supply@madrinas.com", brand: "Madrinas Coffee", flavor: "Dark Roast Espresso", type: "12-Can Case", quantity: 215, zone: "Dry Aisle C" },
  { barcode: "082123456810", lotNumber: "LOT-2026-19", expiryDate: "2027-02-28", vendorEmail: "orders@citrussprings.com", brand: "Citrus Springs", flavor: "Grapefruit Juice", type: "3G Bag-in-Box", quantity: 180, zone: "Cooler Bay-02" },
  { barcode: "082123456811", lotNumber: "LOT-2026-20", expiryDate: "2026-12-15", vendorEmail: "distro@twistedbranch.com", brand: "Twisted Branch", flavor: "Unsweetened Tea", type: "3G Bag-in-Box", quantity: 310, zone: "Dry Aisle B" },
  { barcode: "082123456812", lotNumber: "LOT-2026-21", expiryDate: "2027-06-01", vendorEmail: "wholesale@coolattitudes.com", brand: "Cool Attitudes", flavor: "Mango Puree", type: "1G Jug Case", quantity: 145, zone: "Dry Aisle A" },
  { barcode: "082123456813", lotNumber: "LOT-2026-22", expiryDate: "2027-01-20", vendorEmail: "supply@madrinas.com", brand: "Madrinas Coffee", flavor: "Hazelnut Cold Brew", type: "24-Can Case", quantity: 290, zone: "Dry Aisle C" },
  { barcode: "082123456814", lotNumber: "LOT-2026-23", expiryDate: "2026-10-31", vendorEmail: "orders@citrussprings.com", brand: "Citrus Springs", flavor: "Pineapple Juice", type: "3G Bag-in-Box", quantity: 110, zone: "Cooler Bay-01" },
  { barcode: "082123456815", lotNumber: "LOT-2026-24", expiryDate: "2027-04-05", vendorEmail: "distro@twistedbranch.com", brand: "Twisted Branch", flavor: "Raspberry Lemonade", type: "3G Bag-in-Box", quantity: 275, zone: "Dry Aisle B" },
  { barcode: "082123456816", lotNumber: "LOT-2026-25", expiryDate: "2026-11-20", vendorEmail: "wholesale@coolattitudes.com", brand: "Cool Attitudes", flavor: "Mojito Mix", type: "1G Jug Case", quantity: 65, zone: "Dry Aisle A" },
  { barcode: "082123456817", lotNumber: "LOT-2026-26", expiryDate: "2027-08-15", vendorEmail: "supply@madrinas.com", brand: "Madrinas Coffee", flavor: "Nitro Black", type: "12-Can Case", quantity: 180, zone: "Dry Aisle C" },
  { barcode: "082123456818", lotNumber: "LOT-2026-27", expiryDate: "2027-03-10", vendorEmail: "orders@citrussprings.com", brand: "Citrus Springs", flavor: "Pomegranate Blend", type: "3G Bag-in-Box", quantity: 140, zone: "Cooler Bay-02" },
  { barcode: "082123456819", lotNumber: "LOT-2026-28", expiryDate: "2026-12-25", vendorEmail: "distro@twistedbranch.com", brand: "Twisted Branch", flavor: "Arnold Palmer Base", type: "3G Bag-in-Box", quantity: 200, zone: "Dry Aisle B" },
  { barcode: "082123456820", lotNumber: "LOT-2026-29", expiryDate: "2027-05-20", vendorEmail: "wholesale@coolattitudes.com", brand: "Cool Attitudes", flavor: "Sweet & Sour Mix", type: "1G Jug Case", quantity: 420, zone: "Dry Aisle A" },
  { barcode: "082123456821", lotNumber: "LOT-2026-30", expiryDate: "2027-02-14", vendorEmail: "supply@madrinas.com", brand: "Madrinas Coffee", flavor: "Peppermint Mocha", type: "24-Can Case", quantity: 50, zone: "Dry Aisle C" },
  { barcode: "082123456822", lotNumber: "LOT-2026-31", expiryDate: "2026-11-05", vendorEmail: "orders@citrussprings.com", brand: "Citrus Springs", flavor: "Tomato Juice", type: "3G Bag-in-Box", quantity: 85, zone: "Cooler Bay-01" },
  { barcode: "082123456823", lotNumber: "LOT-2026-32", expiryDate: "2027-07-01", vendorEmail: "distro@twistedbranch.com", brand: "Twisted Branch", flavor: "Blood Orange Lemonade", type: "3G Bag-in-Box", quantity: 160, zone: "Dry Aisle B" },
  { barcode: "082123456824", lotNumber: "LOT-2026-33", expiryDate: "2026-10-15", vendorEmail: "wholesale@coolattitudes.com", brand: "Cool Attitudes", flavor: "Bloody Mary Mix", type: "1G Jug Case", quantity: 130, zone: "Dry Aisle A" },
  { barcode: "082123456825", lotNumber: "LOT-2026-34", expiryDate: "2027-09-10", vendorEmail: "supply@madrinas.com", brand: "Madrinas Coffee", flavor: "Oat Milk Latte", type: "12-Can Case", quantity: 310, zone: "Dry Aisle C" }
];"""
if old_end in content:
    content = content.replace(old_end, 'zone: "Dry Aisle C" }' + new_items)

# 2. Patch fetchInventory to detect and upload the missing rows
fetch_pattern = r'if \(response\.Items && response\.Items\.length > 0\) \{\s*setStock\(response\.Items\);\s*\} else \{'
replacement = """if (response.Items && response.Items.length >= initialMockData.length) {
        setStock(response.Items);
      } else {
        const existingBarcodes = new Set((response.Items || []).map(i => i.barcode));
        const missingItems = initialMockData.filter(i => !existingBarcodes.has(i.barcode));
        if (missingItems.length > 0) {
            await Promise.all(missingItems.map(item => docClient.send(new PutCommand({ TableName: "BeverageInventoryData", Item: item }))));
            const updatedResponse = await docClient.send(new ScanCommand({ TableName: "BeverageInventoryData" }));
            setStock(updatedResponse.Items || initialMockData);
        } else {
            setStock(response.Items);
        }"""

content = re.sub(fetch_pattern, replacement, content)

with open('src/Inventory.js', 'w') as f:
    f.write(content)

print("✅ 25 new flavors injected into initialMockData!")
print("✅ DynamoDB auto-sync logic updated!")
