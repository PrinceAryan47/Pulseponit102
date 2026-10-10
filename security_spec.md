# PulsePoint Security Specification & Hardened Invariants

## 1. Security Architecture & Invariants

1. **Authentication & Identity Immutability**:
   - `request.auth != null` is mandatory for all private data operations.
   - User `uid` in document payloads must strictly match `request.auth.uid`.
   - Immutable fields (`uid`, `email`, `createdAt`, `authorId`, `patientId`) cannot be altered post-creation.
   - Super Administrator privilege is restricted to cryptographically verified emails with `request.auth.token.email_verified == true`. Client-side custom claims or self-assigned roles (`role: 'admin'`) are denied.

2. **Patient Privacy & Least Privilege Access**:
   - Patient profile documents (`/users/{patientId}`) cannot be listed or read by other patients.
   - Doctors can only read patient profiles if an approved `accessRequest` (`/accessRequests/{patientId}_{doctorId}`) exists or a scheduled appointment links them.
   - Unapproved doctors (`status != 'approved'`) cannot read patient records or be listed in the public doctor directory.
   - Medical records (`/medicalRecords/{recordId}`) can only be created/edited by approved doctors, and can only be read by the patient, the attending doctor, or consented doctors.

3. **Doctor Verification & Hospital Management Integrity**:
   - Regular users cannot set `role: 'doctor'` with `status: 'approved'` or `licenseVerificationStatus: 'verified'`.
   - Only Super Administrators can approve or verify doctors and create or edit medical hospitals (`/hospitals`).
   - Doctors cannot self-approve their own `accessRequest` consent requests.

4. **WebRTC Signaling & Direct Messaging Protection**:
   - Messages (`/messages/{messageId}`) must require explicit participant authorization (`request.auth.uid in resource.data.participants` or exact matching of caller/receiver in `roomId.split('_')`). Substring wildcard matching is abolished.
   - Virtual meeting signaling documents (`/meetings/{meetingId}`) and candidate subcollections (`offerCandidates`, `answerCandidates`) require explicit participant or host authorization.
   - WebRTC Socket.IO server verifies Firebase ID tokens upon handshake and validates all room actions.

5. **Resource Boundaries & Input Sanitization**:
   - All string fields are constrained with length limits to prevent Denial of Wallet resource attacks.
   - Chat attachments and uploaded media are bound to room participants with size quotas.

---

## 2. The "Dirty Dozen" Attack Payloads

1. **Self-Escalation to Admin**:
   - Attack: Non-admin signs up with `{ role: 'admin', email: 'attacker@evil.com' }` or updates existing user to `role: 'admin'`.
   - Invariant: Denied. Only existing superadmins with verified emails can write `role: 'admin'`.

2. **Doctor Self-Verification Bypass**:
   - Attack: Unverified doctor attempts to update `/users/{uid}` with `{ status: 'approved', licenseVerificationStatus: 'verified' }`.
   - Invariant: Denied. Modifying `status` or `licenseVerificationStatus` is forbidden for non-admins.

3. **Patient PII Directory Scraping**:
   - Attack: Attacker queries `collection(db, 'users')` without filters or attempts to read `/users/{victimUid}`.
   - Invariant: Denied. `list` is restricted to the user's own document or approved public doctors (`role == 'doctor' && status == 'approved'`).

4. **Medical Record Tampering / Injection**:
   - Attack: Patient or unapproved doctor attempts to `create` or `update` a `/medicalRecords/{recordId}` document.
   - Invariant: Denied. Writes require `isDoctor() && request.auth.uid == request.resource.data.doctorId`.

5. **Unauthorized Consent Approval**:
   - Attack: Doctor submits update on `/accessRequests/{patientId}_{doctorId}` setting `status: 'approved'`.
   - Invariant: Denied. Only the patient (`request.auth.uid == resource.data.patientId`) can set `status: 'approved'`.

6. **Eavesdropping on Private Messages via Substring Collision**:
   - Attack: User with UID `abc` crafts a `roomId: 'secret_abc_victim'` and attempts to read `/messages`.
   - Invariant: Denied. Rules enforce exact participant list or exact 2-element split check.

7. **Hijacking WebRTC Meeting Candidates**:
   - Attack: Uninvited third party reads `/meetings/{meetingId}/offerCandidates/{id}`.
   - Invariant: Denied. Access requires caller to be in meeting's authorized participants or host.

8. **Fake Hospital Creation**:
   - Attack: Ordinary user creates a document in `/hospitals/{hospitalId}`.
   - Invariant: Denied. `create`, `update`, `delete` on `/hospitals` strictly requires `isSuperAdmin()`.

9. **Email Registry Exfiltration**:
   - Attack: Unauthenticated client requests `getDocs(collection(db, 'emails'))`.
   - Invariant: Denied. Public reads on `/emails` are revoked.

10. **Notification Spam / Phishing Injection**:
    - Attack: Malicious user creates notification for victim with arbitrary `senderId`.
    - Invariant: Denied. Notification creation validates schema and requires `request.resource.data.senderId == request.auth.uid`.

11. **Article Hijacking / Sabotage**:
    - Attack: Doctor B updates or deletes article authored by Doctor A.
    - Invariant: Denied. Update and delete require `resource.data.authorId == request.auth.uid` or `isSuperAdmin()`.

12. **Socket.IO Identity Impersonation**:
    - Attack: Attacker connects to WebSocket without token and emits `register-user` with `userId: 'victimUid'`.
    - Invariant: Denied. Socket.IO rejects unauthenticated connections and extracts `userId` strictly from verified Firebase ID token.
