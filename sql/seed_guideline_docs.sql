-- Four guideline summaries for Drishti's knowledge base (RAG).
-- Original patient-friendly wording based on Indian national guidance:
--   ICMR Standard Treatment Workflows, 2024 (advisory): Knee OA, Hip OA, Low Back Pain, Neck Pain
--   MoHFW Standard Treatment Guidelines: Management of Osteoarthritis Knee, 2017
-- No medicine names or doses on purpose. Have a physiotherapist review before real use.
-- After running this, open /api/ingest?key=YOUR_INGEST_SECRET until remaining_documents is 0.
-- Safe to re-run: removes the old guideline documents and their chunks, then re-inserts them.

delete from public.chunks where document_id in (select id from public.documents where source_type = 'guideline');
delete from public.documents where source_type = 'guideline';

insert into public.documents (title, source_type, language, content) values

('Knee osteoarthritis: what Indian guidelines recommend at home', 'guideline', 'en', $$
Knee osteoarthritis is wear-related change in the knee joint. It is common after middle age and causes pain, stiffness and difficulty with stairs, squatting or getting up from the floor.

Indian national guidance (ICMR Standard Treatment Workflow for knee osteoarthritis, and the MoHFW Standard Treatment Guidelines) treats exercise as a core part of care for people of every age. The main exercises are strengthening the front thigh muscle (quadriceps) and stretching the back of the thigh (hamstrings). Regular walking on flat ground also helps.

Daily habits that reduce load on the knee: avoid sitting cross-legged on the floor, avoid deep squatting such as on an Indian-style toilet, and limit stair climbing where you can. Losing weight if you are overweight reduces pain. Comfortable, cushioned footwear, heat or cold packs, and a walking stick or knee support can help on bad days.

PhysioDrishti can share a short set of clinician-approved home exercises for knee osteoarthritis. A physiotherapist can then check your knee and adjust them for you.

See a doctor promptly if the knee is hot, red and swollen, if you have a fever, if it gives way or locks, or if you cannot put weight on it after an injury.
$$),

('Hip osteoarthritis: what Indian guidelines recommend at home', 'guideline', 'en', $$
Hip osteoarthritis causes pain in the groin, buttock or thigh, stiffness in the morning, and difficulty putting on socks, sitting cross-legged or walking long distances.

The ICMR Standard Treatment Workflow for hip osteoarthritis advises exercises that strengthen the muscles on the side of the hip (abductors), the back of the hip (extensors) and the front of the thigh (quadriceps), along with regular physical activity.

Helpful habits: avoid standing for long periods, avoid sitting cross-legged and deep squatting, and limit stairs where possible. A walking stick held in the hand opposite the painful hip takes load off the joint. Losing weight if you are overweight reduces pain.

PhysioDrishti can share a short set of clinician-approved home exercises for hip osteoarthritis. A physiotherapist can check your hip and progress them safely.

See a doctor promptly for sudden severe hip pain, pain after a fall (especially in older adults), fever, or if you cannot bear weight.
$$),

('Lower back pain: what Indian guidelines recommend at home', 'guideline', 'en', $$
Most lower back pain is not caused by serious disease and improves with time and the right activity.

The ICMR Standard Treatment Workflow for low back pain advises staying active and continuing daily activities as much as you can, returning to work early, and starting back-strengthening exercises and physical activity once the pain is bearable. Alternating cold and heat packs can ease pain. Avoid lifting heavy weights while it settles. Long bed rest is not advised.

If pain is not improving, the guidance suggests a review by a doctor after 2 to 6 weeks.

PhysioDrishti can share a short set of clinician-approved home exercises for lower back pain, such as gentle pelvic tilts, bridges and walking.

Get urgent medical help, and do not start exercises, if back pain comes with numbness around the groin or buttocks, loss of bladder or bowel control, new weakness in a leg, fever, unexplained weight loss, a past history of cancer, severe pain at night, or pain after a fall or accident. A first ever severe episode after age 50, or back pain in someone on long-term steroids, should also be checked by a doctor first.
$$),

('Neck pain: what Indian guidelines recommend at home', 'guideline', 'en', $$
Neck pain is very common, especially with long hours on a laptop or phone. Most cases are not serious.

The ICMR Standard Treatment Workflow for neck pain advises relative rest in the early, acute stage, then neck-strengthening exercises, and continuing normal daily activities. Alternating cold and heat packs can ease pain. Taking regular breaks from screens and keeping the screen near eye level helps.

PhysioDrishti can share a short set of clinician-approved home exercises for neck pain, such as chin tucks, gentle neck presses and shoulder blade squeezes.

Get medical help first, and do not start exercises, if neck pain follows an accident or fall, or comes with numbness, tingling or weakness in an arm or hand, fever, unexplained weight loss, a past history of cancer, a severe headache, dizziness, or trouble walking or with balance.
$$);

select id, title from public.documents where source_type = 'guideline' order by id;
