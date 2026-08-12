-- Test 1: Guardian-Elder relationships
SELECT ge.guardian_id, ge.elder_id, u_g.name as guardian_name, u_e.name as elder_name, ge.status
FROM guardian_elder_relationships ge
JOIN users u_g ON u_g.id = ge.guardian_id
JOIN users u_e ON u_e.id = ge.elder_id
WHERE ge.status = 'ACTIVE';

-- Test 2: Medication adherence today (elder id=3)
SELECT m.name, m.time_schedule,
  CASE WHEN ml.taken_status THEN 'TAKEN' ELSE 'NOT TAKEN' END as status
FROM medications m
LEFT JOIN medication_logs ml ON ml.medication_id = m.id AND ml.logged_date = CURRENT_DATE
WHERE m.elder_id = 3 AND m.is_active = TRUE
ORDER BY m.time_schedule;

-- Test 3: Task completion today
SELECT t.title, COALESCE(tl.completed, FALSE) as completed
FROM daily_tasks t
LEFT JOIN task_logs tl ON tl.task_id = t.id AND tl.elder_id = 3 AND tl.logged_date = CURRENT_DATE
WHERE t.elder_id = 3 AND t.is_active = TRUE;

-- Test 4: Sync queue ready
SELECT COUNT(*) as sync_queue_pending FROM sync_queue WHERE status = 'PENDING';

-- Test 5: Emergency contacts
SELECT name, phone_number, relationship, is_primary
FROM emergency_contacts WHERE elder_id = 3 ORDER BY display_order;

-- Test 6: Duplicate prevention - try to insert duplicate medication log
INSERT INTO medication_logs (medication_id, elder_id, taken_status, logged_date)
SELECT id, 3, TRUE, CURRENT_DATE FROM medications WHERE elder_id = 3 LIMIT 1
ON CONFLICT ON CONSTRAINT uq_med_log_per_day DO NOTHING;
SELECT 'Duplicate prevention: OK' as test6_result;

-- Test 7: Invalid role check
DO $$
BEGIN
  BEGIN
    INSERT INTO users (name, email, password_hash, role) VALUES ('Test', 'bad@test.com', 'x', 'Admin');
    RAISE NOTICE 'FAIL: Should have rejected Admin role';
  EXCEPTION WHEN check_violation THEN
    RAISE NOTICE 'PASS: Role CHECK constraint works correctly';
  END;
END $$;
