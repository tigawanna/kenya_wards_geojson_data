--  list loaded triggrsrs
SELECT name
FROM sqlite_master
WHERE
    type = 'trigger'
    AND name = 'event_trigger'
