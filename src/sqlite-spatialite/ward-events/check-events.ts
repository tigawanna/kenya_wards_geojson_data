import { initDb } from "../lib/client.js";

function detailedEventCheck() {
  console.log("Running detailed event check...");
  
  const { db } = initDb();
  
  try {
    // Explicit transaction to ensure all changes are visible
    db.prepare("BEGIN TRANSACTION").run();
    
    // Insert test data again
    console.log("\n--- Inserting test data again ---");
    const insertStmt = db.prepare(`
      INSERT INTO kenya_wards (
        ward_code, ward, county, county_code, constituency, constituency_code, 
        geom
      ) VALUES (
        ?, ?, ?, ?, ?, ?, 
        GeomFromText(?, 4326)
      )
    `);
    
    console.log("Inserting test ward...");
    insertStmt.run(
      "TEST003", 
      "Test Ward 3", 
      "Test County 3", 
      997, 
      "Test Constituency 3", 
      9997, 
      "POINT(36.817223 -1.286389)"
    );
    console.log("✓ Test ward inserted");
    
    console.log("\n--- Updating test data ---");
    const updateStmt = db.prepare(`
      UPDATE kenya_wards 
      SET ward = ?, county = ? 
      WHERE ward_code = ?
    `);
    
    updateStmt.run("Updated Test Ward 3", "Updated Test County 3", "TEST003");
    console.log("✓ Test ward updated");
    
    console.log("\n--- Deleting test data ---");
    const deleteStmt = db.prepare(`
      DELETE FROM kenya_wards 
      WHERE ward_code = ?
    `);
    
    deleteStmt.run("TEST003");
    console.log("✓ Test ward deleted");
    
    // Get all events now
    console.log("\n--- All events in the table ---");
    const allEvents = db.prepare(`
      SELECT * FROM kenya_ward_events 
      WHERE ward_code = 'TEST003'
      ORDER BY timestamp DESC
    `).all();
    
    console.log("Number of events found:", allEvents.length);
    allEvents.forEach((event, index) => {
      console.log(`${index + 1}.`, {
        id: event.id,
        eventType: event.event_type,
        wardCode: event.ward_code,
        timestamp: event.timestamp,
        syncStatus: event.sync_status
      });
    });
    
    // Clean up
    db.prepare("DELETE FROM kenya_ward_events WHERE ward_code = 'TEST003'").run();
    console.log("\n✓ Cleaned up test events");
    
    db.prepare("COMMIT").run();
    
  } catch (error) {
    console.error("Error in detailed event check:", error);
    db.prepare("ROLLBACK").run();
  } finally {
    db.close();
  }
}

detailedEventCheck();
