import { initDb } from "../lib/client.js";

function testTriggers() {
  console.log("Testing SQLite triggers...");
  
  const { db } = initDb();
  
  try {
    // Check if triggers exist
    const triggers = db.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='trigger' AND name LIKE '%ward%'
    `).all();
    
    console.log("Triggers found:", triggers);
    
    // Test by inserting a ward and checking if an event is created
    console.log("\n--- Testing trigger functionality ---");
    
    // Get initial event count
    const initialEventCount = db.prepare("SELECT COUNT(*) as count FROM kenya_ward_events").get();
    console.log("Initial events count:", initialEventCount.count);
    
    // Insert a test ward
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
      "TEST001", 
      "Test Ward", 
      "Test County", 
      999, 
      "Test Constituency", 
      9999, 
      "POINT(36.817223 -1.286389)"
    );
    console.log("✓ Test ward inserted");
    
    // Check if an event was created
    const afterInsertEventCount = db.prepare("SELECT COUNT(*) as count FROM kenya_ward_events").get();
    console.log("Events after insert:", afterInsertEventCount.count);
    
    if (afterInsertEventCount.count > initialEventCount.count) {
      console.log("✓ INSERT trigger fired successfully");
      
      // Get the latest event
      const latestEvent = db.prepare(`
        SELECT * FROM kenya_ward_events 
        ORDER BY timestamp DESC 
        LIMIT 1
      `).get();
      
      console.log("Latest event:", {
        id: latestEvent.id,
        eventType: latestEvent.event_type,
        wardCode: latestEvent.ward_code,
        syncStatus: latestEvent.sync_status
      });
    } else {
      console.log("✗ INSERT trigger did not fire");
    }
    
    // Clean up test data
    db.prepare("DELETE FROM kenya_wards WHERE ward_code = ?").run("TEST001");
    db.prepare("DELETE FROM kenya_ward_events WHERE ward_code = ?").run("TEST001");
    
    console.log("\n✓ Test data cleaned up");
    console.log("Trigger testing complete!");
    
  } catch (error) {
    console.error("Error in trigger testing:", error);
  } finally {
    db.close();
  }
}

// Run the test
testTriggers();
