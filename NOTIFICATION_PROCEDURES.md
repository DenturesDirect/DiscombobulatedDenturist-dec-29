# 📱 Notification Procedures

## Current Status
- ✅ Email notifications toggle added
- ✅ Text notifications toggle added
- ⏳ Notification triggers need to be defined

## What Procedures Should Trigger Notifications?

We need to decide which events should send notifications to patients. Here are some common options:

### Appointment-Related
- [ ] Appointment scheduled
- [ ] Appointment reminder (24 hours before)
- [ ] Appointment cancelled/rescheduled
- [ ] Appointment confirmed

### Treatment Progress
- [ ] Lab prescription sent to lab
- [ ] Case ready for pickup
- [ ] Try-in appointment scheduled
- [ ] Final delivery ready
- [ ] Adjustment needed

### Administrative
- [ ] Insurance estimate ready
- [ ] Payment due
- [ ] Payment received
- [ ] Documents ready for review

### Other
- [ ] Follow-up reminder
- [ ] Maintenance reminder
- [ ] New treatment option available

---

## Questions to Answer:

1. **Which procedures are most important?** (Top 3-5)
2. **Should notifications be sent immediately or batched?**
3. **Different messages for email vs text?** (Texts shorter?)
4. **Should patients be able to opt-out of specific notification types?**
5. **Any procedures that should NEVER trigger notifications?**

---

**Once you decide, I'll implement the notification triggers!**
