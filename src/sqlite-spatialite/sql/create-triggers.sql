-- Triggers to automatically log events for kenya_wards table changes

-- INSERT trigger
CREATE TRIGGER IF NOT EXISTS ward_insert_trigger
AFTER INSERT ON kenya_wards
FOR EACH ROW
BEGIN
  INSERT INTO kenya_ward_events (
    id, event_type, ward_id, ward_code, old_data, new_data, timestamp, sync_status, sync_attempts
  ) VALUES (
    lower(hex(randomblob(4)) || '-' || hex(randomblob(2)) || '-4' || substr(hex(randomblob(2)), 2) || '-' || substr('89ab', abs(random()) % 4 + 1, 1) || substr(hex(randomblob(2)), 2) || '-' || hex(randomblob(6))),
    'INSERT',
    (SELECT id FROM kenya_wards WHERE ward_code = NEW.ward_code ORDER BY id DESC LIMIT 1),
    NEW.ward_code,
    NULL,
    json_object(
      'id', (SELECT id FROM kenya_wards WHERE ward_code = NEW.ward_code ORDER BY id DESC LIMIT 1),
      'ward_code', NEW.ward_code,
      'ward', NEW.ward,
      'county', NEW.county,
      'county_code', NEW.county_code,
      'sub_county', NEW.sub_county,
      'constituency', NEW.constituency,
      'constituency_code', NEW.constituency_code,
      'minx', NEW.minx,
      'miny', NEW.miny,
      'maxx', NEW.maxx,
      'maxy', NEW.maxy,
      'geom', AsGeoJSON(NEW.geom)
    ),
    CURRENT_TIMESTAMP,
    'PENDING',
    0
  );
END;

-- UPDATE trigger
CREATE TRIGGER IF NOT EXISTS ward_update_trigger
AFTER UPDATE ON kenya_wards
FOR EACH ROW
BEGIN
  INSERT INTO kenya_ward_events (
    id, event_type, ward_id, ward_code, old_data, new_data, timestamp, sync_status, sync_attempts
  ) VALUES (
    lower(hex(randomblob(4)) || '-' || hex(randomblob(2)) || '-4' || substr(hex(randomblob(2)), 2) || '-' || substr('89ab', abs(random()) % 4 + 1, 1) || substr(hex(randomblob(2)), 2) || '-' || hex(randomblob(6))),
    'UPDATE',
    NEW.id,
    NEW.ward_code,
    json_object(
      'id', OLD.id,
      'ward_code', OLD.ward_code,
      'ward', OLD.ward,
      'county', OLD.county,
      'county_code', OLD.county_code,
      'sub_county', OLD.sub_county,
      'constituency', OLD.constituency,
      'constituency_code', OLD.constituency_code,
      'minx', OLD.minx,
      'miny', OLD.miny,
      'maxx', OLD.maxx,
      'maxy', OLD.maxy,
      'geom', AsGeoJSON(OLD.geom)
    ),
    json_object(
      'id', NEW.id,
      'ward_code', NEW.ward_code,
      'ward', NEW.ward,
      'county', NEW.county,
      'county_code', NEW.county_code,
      'sub_county', NEW.sub_county,
      'constituency', NEW.constituency,
      'constituency_code', NEW.constituency_code,
      'minx', NEW.minx,
      'miny', NEW.miny,
      'maxx', NEW.maxx,
      'maxy', NEW.maxy,
      'geom', AsGeoJSON(NEW.geom)
    ),
    CURRENT_TIMESTAMP,
    'PENDING',
    0
  );
END;

-- DELETE trigger
CREATE TRIGGER IF NOT EXISTS ward_delete_trigger
AFTER DELETE ON kenya_wards
FOR EACH ROW
BEGIN
  INSERT INTO kenya_ward_events (
    id, event_type, ward_id, ward_code, old_data, new_data, timestamp, sync_status, sync_attempts
  ) VALUES (
    lower(hex(randomblob(4)) || '-' || hex(randomblob(2)) || '-4' || substr(hex(randomblob(2)), 2) || '-' || substr('89ab', abs(random()) % 4 + 1, 1) || substr(hex(randomblob(2)), 2) || '-' || hex(randomblob(6))),
    'DELETE',
    OLD.id,
    OLD.ward_code,
    json_object(
      'id', OLD.id,
      'ward_code', OLD.ward_code,
      'ward', OLD.ward,
      'county', OLD.county,
      'county_code', OLD.county_code,
      'sub_county', OLD.sub_county,
      'constituency', OLD.constituency,
      'constituency_code', OLD.constituency_code,
      'minx', OLD.minx,
      'miny', OLD.miny,
      'maxx', OLD.maxx,
      'maxy', OLD.maxy,
      'geom', AsGeoJSON(OLD.geom)
    ),
    NULL,
    CURRENT_TIMESTAMP,
    'PENDING',
    0
  );
END;
