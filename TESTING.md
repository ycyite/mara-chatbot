# Testing Guide for Mara Chatbot

This guide helps you test all scenarios from the K-Scripts document to ensure Mara works correctly.

## Prerequisites

1. Server is running (locally or on Railway)
2. OpenAI API key is configured
3. Browser is open to the chat interface

## Test Scenarios

### Scenario 1: Fee Inquiry (From K-Scripts Page 3)

**Objective**: Test fee inquiry handling and escalation

**Steps**:
1. Open the chat interface
2. Enter user information:
   - Name: "Amisha"
   - Student Number: "410622548"
   - Chat ID: Leave blank
3. Click "Start Chat"
4. Send message: "Hi Mara, I'm concerned about my fees. I feel like I'm paying more as a remote student. Why do I have gym and bus-pass fees."

**Expected Response**:
- Mara acknowledges the concern
- Explains McMaster's full-time policy (6+ units = mandatory fees)
- Offers to connect with MSU Student Council
- Mentions Rashid Farooq's contact: rashiq.farooq@mcmaster.ca
- States office hours: Mon-Thurs 8am-12pm, Fri 10am-12pm
- Mentions 2-4 business day response time
- Displays Chat ID (e.g., "40067")

**Validation**:
- [ ] Response shows empathy
- [ ] Explains policy clearly
- [ ] Provides correct contact info
- [ ] Generates and displays Chat ID
- [ ] Tone is helpful, not dismissive

---

### Scenario 2: Emotional Fatigue (From K-Scripts Page 4)

**Objective**: Test emotional detection and crisis escalation

**Steps**:
1. Start new chat or continue
2. Enter name: "Amisha" (or your test name)
3. Student Number: "410622548"
4. First message: "Hi Mara, I honestly can't handle this anymore. Working full-time and taking five courses is exhausting and frustrating now."

**Expected First Response**:
- Empathetic validation ("That sounds really tough")
- Normalizes feelings ("Many remote students feel this way")
- Acknowledges accomplishments ("You've accomplished so much")
- Offers strategies to manage schedule

**Next Step**:
5. Send: "I don't think that's enough anymore. I just like giving up."

**Expected Second Response** (Crisis Detection):
- Immediately validates feelings
- Expresses concern
- Mentions Student Wellness Centre
- Provides contact: 905-525-9140 ext. 27700
- Mentions 24/7 Crisis Line: 1-866-925-5454
- Offers immediate connection options (chat, callback, email)
- Warm, supportive tone

6. Send: "Yes, please connect me."
7. Choose: "A call would be better"

**Expected Third Response**:
- Confirms callback scheduled
- Mentions phone number (masked: ending in -XXXX)
- States 45-minute callback window
- Provides Chat ID
- Encouraging closing

**Validation**:
- [ ] First response is empathetic but not alarming
- [ ] Second response detects crisis keywords
- [ ] Escalation is immediate for crisis
- [ ] Contact info is complete and correct
- [ ] Tone remains supportive throughout
- [ ] Chat ID provided for continuity

---

### Scenario 3: Prospective Student (From K-Scripts Page 5)

**Objective**: Test handling of non-enrolled users

**Steps**:
1. Start new chat
2. Enter:
   - Name: "Samaira"
   - Student Number: Leave blank (or invalid format)
   - Chat ID: Leave blank
3. Click "Start Chat"
4. Send: "Hi, I'm not a student yet, but I'm interested in the Software Engineering degree completion program."

**Expected Response**:
- Welcomes interest warmly
- Identifies user as prospective student
- Explains they can't access internal systems yet
- Provides Dr. Laura Bennett's contact: bennettl@mcmaster.ca
- States office hours: Mon-Thurs 9am-3pm
- Mentions 1-2 business day response time
- Generates Chat ID for future use
- Encouraging message about application

**Validation**:
- [ ] Recognizes user as prospective (no student number)
- [ ] Doesn't try to access internal student data
- [ ] Provides correct admission advisor contact
- [ ] Tone is welcoming and encouraging
- [ ] Chat ID generated for continuity
- [ ] Explains what to expect from contact

---

## Additional Test Cases

### Test 4: Chat ID Continuity

**Objective**: Test chat ID system works

**Steps**:
1. Complete Scenario 1 and note the Chat ID (e.g., "40067")
2. Close browser / end session
3. Reopen chat interface
4. Enter:
   - Name: "Amisha"
   - Student Number: "410622548"
   - Chat ID: Enter the previous Chat ID
5. Send a message: "I wanted to follow up on the fee issue we discussed"

**Expected Response**:
- Mara references previous conversation
- Maintains context of fee inquiry
- May mention "As we discussed earlier..."

**Validation**:
- [ ] Previous context is recalled
- [ ] Response shows continuity
- [ ] Same Chat ID is displayed

---

### Test 5: Knowledge Retrieval (RAG)

**Objective**: Test knowledge base search

**Steps**:
1. Start new chat
2. Send various queries testing different topics:

**Query A**: "How do I register for courses?"
**Expected**: Information about Mosaic, registration windows, full-time status

**Query B**: "What remote learning resources are available?"
**Expected**: Online library, virtual advising, technical support info

**Query C**: "How can I access the library remotely?"
**Expected**: E-books, databases, research help, libref@mcmaster.ca contact

**Validation**:
- [ ] Responses include specific information from knowledge.json
- [ ] Sources are mentioned when possible
- [ ] Information is accurate and relevant
- [ ] Responses stay on-topic

---

### Test 6: Intent Detection

**Objective**: Verify intent classifier works

**Test Messages**:

| Message | Expected Intent | Expected Emotion |
|---------|----------------|------------------|
| "What are the tuition deadlines?" | fee_inquiry | neutral |
| "I'm frustrated about paying for services I can't use" | fee_inquiry | frustrated |
| "This is overwhelming, I need help" | emotional_support | stressed |
| "How do I add a course?" | course_question | neutral |
| "Can I speak to an advisor?" | general_inquiry | neutral |

**Validation**:
- [ ] Correct intent detected (check server logs or response tone)
- [ ] Emotional state affects response style
- [ ] Appropriate escalation when needed

---

### Test 7: Multiple Topics in One Session

**Objective**: Test conversation memory and context switching

**Steps**:
1. Start chat
2. Ask about fees
3. Ask about courses
4. Express feeling stressed
5. Ask technical question

**Validation**:
- [ ] Mara handles topic switches smoothly
- [ ] Maintains friendly tone throughout
- [ ] Doesn't confuse topics
- [ ] Can reference earlier topics if user brings them up

---

### Test 8: Error Handling

**Objective**: Test graceful error handling

**Steps**:

**Test A: Empty message**
- Send empty message
- Expected: Send button disabled or validation message

**Test B: Very long message**
- Send 500+ word message
- Expected: Mara responds appropriately (may summarize)

**Test C: Invalid session** (if API testing)
- Use invalid sessionId
- Expected: Error message asking to start new session

**Test D: No OpenAI key** (local dev)
- Remove OPENAI_API_KEY from .env
- Expected: Fallback response with contact info

**Validation**:
- [ ] No crashes
- [ ] User-friendly error messages
- [ ] Suggests next steps

---

## Performance Tests

### Response Time
- [ ] Login/session creation < 1 second
- [ ] Simple queries < 3 seconds
- [ ] Complex queries with RAG < 5 seconds
- [ ] Typing indicator shows during processing

### UI/UX
- [ ] Chat interface loads properly
- [ ] Messages display correctly
- [ ] Markdown formatting works (bold, links)
- [ ] Scrolling works smoothly
- [ ] Mobile responsive (if testing on mobile)

---

## API Testing (Optional)

Use Postman, curl, or similar:

### Test Health Check
```bash
curl https://your-app.railway.app/health
```
Expected: `{"status":"healthy",...}`

### Test Session Creation
```bash
curl -X POST https://your-app.railway.app/api/session \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","studentNumber":"400123456"}'
```

### Test Chat
```bash
curl -X POST https://your-app.railway.app/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId":"your-session-id",
    "message":"Hello Mara",
    "name":"Test User"
  }'
```

---

## Testing Checklist

Before considering testing complete:

### Functional Tests
- [ ] All 3 K-Script scenarios pass
- [ ] Chat ID system works
- [ ] Knowledge retrieval is accurate
- [ ] Intent detection is working
- [ ] Escalation triggers correctly
- [ ] Error handling is graceful

### Personality Tests
- [ ] Tone is warm and empathetic
- [ ] Uses encouraging language
- [ ] Validates emotions before solving
- [ ] Provides clear next steps
- [ ] References McMaster correctly

### Technical Tests
- [ ] API responds within acceptable time
- [ ] Frontend interface works smoothly
- [ ] No console errors
- [ ] Sessions expire correctly (24 hours)
- [ ] Memory doesn't leak (long sessions)

### Production Readiness
- [ ] Railway deployment successful
- [ ] Environment variables set correctly
- [ ] Health check returns 200
- [ ] Logs show no critical errors
- [ ] Crisis detection tested thoroughly
- [ ] All contacts are accurate

---

## Bug Report Template

If you find issues:

```
**Bug**: [Brief description]

**Steps to Reproduce**:
1.
2.
3.

**Expected Behavior**:

**Actual Behavior**:

**Screenshots/Logs**:

**Environment**:
- Local or Railway?
- Browser/version:
- Session ID:
```

---

## Test Results Log

Create a simple log of your tests:

```
Date: [Date]
Tester: [Your Name]
Environment: [Local/Railway]

| Test Case | Status | Notes |
|-----------|--------|-------|
| Scenario 1 (Fee) | ✓ Pass | Chat ID: 40067 |
| Scenario 2 (Crisis) | ✓ Pass | Escalation worked |
| Scenario 3 (Prospective) | ✓ Pass | |
| Chat ID Continuity | ✓ Pass | |
| Knowledge Retrieval | ✓ Pass | |
| Error Handling | ⚠ Minor Issue | Empty message needs validation |
```

---

## Success Criteria

Mara is ready for use when:
1. ✓ All 3 K-Script scenarios work correctly
2. ✓ Crisis detection and escalation are reliable
3. ✓ Responses are empathetic and helpful
4. ✓ Knowledge retrieval is accurate
5. ✓ No critical bugs in normal use
6. ✓ Deployed successfully on Railway
7. ✓ Performance is acceptable (< 5s responses)

**Happy Testing! 🧪**
