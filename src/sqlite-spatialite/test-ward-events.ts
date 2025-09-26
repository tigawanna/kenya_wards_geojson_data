// import { initDb } from "./client.js";
import { setupDb } from "./insert_all.js";
import { initDb } from "./lib/client.js";

async function testWardEvents() {
  // Create test database with different name
  const { db: testDb } = initDb("test_ward_events.db");
  
  console.log("🧪 Setting up test database...");
  await setupDb(testDb);
  
  // Reopen database for testing
  const { db } = initDb("test_ward_events.db");
  
  try {
    console.log("\n📊 Testing ward events triggers...");
    
    // Test INSERT trigger
    console.log("\n1. Testing INSERT trigger:");
    const insertResult = db.prepare(`
      INSERT INTO kenya_wards (ward_code, ward, county, constituency, county_code, constituency_code)
      VALUES ('TEST001', 'Test Ward', 'Test County', 'Test Constituency', 999, 999)
    `).run();
    
    const insertEvents = db.prepare(`
      SELECT * FROM kenya_ward_events WHERE event_type = 'INSERT' ORDER BY timestamp DESC LIMIT 1
    `).all();
    
    console.log(`✅ Inserted ward ID: ${insertResult.lastInsertRowid}`);
    console.log(`✅ INSERT events logged: ${insertEvents.length}`);
    if (insertEvents.length > 0) {
      console.log(`   Event ID: ${insertEvents[0].id}`);
      console.log(`   Trigger by: ${insertEvents[0].trigger_by}`);
      console.log(`   Ward ID: ${insertEvents[0].ward_id}`);
    }
    
    // Test UPDATE trigger
    console.log("\n2. Testing UPDATE trigger:");
    db.prepare(`
      UPDATE kenya_wards 
      SET ward = 'Updated Test Ward' 
      WHERE id = ?
    `).run(insertResult.lastInsertRowid);
    
    const updateEvents = db.prepare(`
      SELECT * FROM kenya_ward_events WHERE event_type = 'UPDATE' ORDER BY timestamp DESC LIMIT 1
    `).all();
    
    console.log(`✅ UPDATE events logged: ${updateEvents.length}`);
    if (updateEvents.length > 0) {
      console.log(`   Event ID: ${updateEvents[0].id}`);
      console.log(`   Trigger by: ${updateEvents[0].trigger_by}`);
      console.log(`   Has old_data: ${updateEvents[0].old_data ? 'Yes' : 'No'}`);
      console.log(`   Has new_data: ${updateEvents[0].new_data ? 'Yes' : 'No'}`);
    }
    
    // Test DELETE trigger
    console.log("\n3. Testing DELETE trigger:");
    db.prepare(`
      DELETE FROM kenya_wards WHERE id = ?
    `).run(insertResult.lastInsertRowid);
    
    const deleteEvents = db.prepare(`
      SELECT * FROM kenya_ward_events WHERE event_type = 'DELETE' ORDER BY timestamp DESC LIMIT 1
    `).all();
    
    console.log(`✅ DELETE events logged: ${deleteEvents.length}`);
    if (deleteEvents.length > 0) {
      console.log(`   Event ID: ${deleteEvents[0].id}`);
      console.log(`   Trigger by: ${deleteEvents[0].trigger_by}`);
      console.log(`   Has old_data: ${deleteEvents[0].old_data ? 'Yes' : 'No'}`);
    }
    
    // Show all events summary
    console.log("\n📈 Events Summary:");
    const eventsSummary = db.prepare(`
      SELECT event_type, trigger_by, COUNT(*) as count
      FROM kenya_ward_events 
      GROUP BY event_type, trigger_by
      ORDER BY event_type
    `).all();
    
    eventsSummary.forEach(row => {
      console.log(`   ${row.event_type} (${row.trigger_by}): ${row.count} events`);
    });
    
    console.log("\n🎉 Ward events test completed successfully!");
    
  } catch (error) {
    console.error("💥 Test failed:", error);
  } finally {
    db.close();
  }
}

testWardEvents().catch(console.error);
