# Session Handoff Template

## **MANDATORY Session Completion Checklist**

When any major issue or milestone is complete, follow this exact sequence:

### **1. Issue/PR Completion**

- [ ] Verify all success criteria met
- [ ] All tests passing, no regressions
- [ ] PR merged to master
- [ ] GitHub issue closed with completion reference

### **2. Documentation Updates**

- [ ] Update `CLAUDE.md` with current status and next priorities
- [ ] Create session handoff document: `SESSION-HANDOFF-[description]-[YYYY-MM-DD].md`
- [ ] Archive old documentation to `docs/implementation/archive/`
- [ ] Update README.md if major features completed

### **3. Environment Cleanup**

- [ ] Return to `master` branch (clean working state)
- [ ] Clean up background processes (`killall node` if needed)
- [ ] Verify git status clean
- [ ] Remove temporary files/branches if any

### **4. Strategic Planning**

- [ ] Consult relevant agents for next priorities if needed
- [ ] Update GitHub issues with current status
- [ ] Document dependencies and blockers
- [ ] Identify immediate next session priority

### **5. Next Session Preparation**

- [ ] Create 5-10 line session prompt for Doctor Hubert
- [ ] Include immediate priority, context docs, and expected timeline
- [ ] Note any background processes or cleanup needed
- [ ] Confirm ready state for seamless continuation

## **Session Prompt Template**

**Format for Doctor Hubert:**

```
Continue from [Issue/Achievement] completion ([brief status]).

**Immediate priority**: [Next issue/task] ([timeline])
**Context**: [Key achievement/current state]
**Reference docs**: [Essential documents to review]
**Ready state**: [Environment status, any cleanup notes]

**Expected scope**: [What the next session should accomplish]
```

## **Example Session Prompts**

### Example 1: After Performance Optimization

```
Continue from Issue #40 completion (performance 0.08→0.70+ achieved, PR #43 merged).

**Immediate priority**: Deploy to production (Issue #46, 1-2 hours)
**Context**: All optimizations merged to master, ready for real-world validation
**Reference docs**: docs/implementation/SESSION-HANDOFF-STRATEGIC-PLANNING-2025-10-01.md
**Ready state**: Master branch clean, background processes noted for cleanup

**Expected scope**: Deploy optimizations and validate ≥0.7 performance in production
```

### Example 2: After Security Implementation

```
Continue from Issue #45 completion (comprehensive security hardening implemented).

**Immediate priority**: Portfolio-focused optimization (Issue #50, 3-4 hours)
**Context**: Security middleware, CSP headers, and API hardening complete
**Reference docs**: docs/implementation/SECURITY-IMPLEMENTATION-COMPLETE-[DATE].md
**Ready state**: Master branch secure, all security tests passing

**Expected scope**: Streamline architecture for textile designer portfolio use case
```

### Example 3: Before Major Audit

```
Continue from strategic optimization completion (Issues #46-50 complete).

**Immediate priority**: Comprehensive 8-agent audit (Issue #49, 4-6 hours)
**Context**: Clean, optimized, secure foundation ready for analysis
**Reference docs**: docs/implementation/FOUNDATION-COMPLETE-[DATE].md
**Ready state**: All dependencies resolved, stable baseline established

**Expected scope**: Full architectural review and future roadmap generation
```

## **Key Guidelines**

### **Session Prompt Best Practices**

- **Be specific**: Include exact issue numbers and timelines
- **Provide context**: Explain what was just completed
- **Reference documentation**: Point to specific handoff documents
- **Note environment state**: Mention any cleanup or background processes
- **Set expectations**: Clear scope for what the next session should accomplish

### **Documentation Organization**

- **Current docs**: Keep in `docs/implementation/`
- **Archive old docs**: Move completed phase docs to `docs/implementation/archive/`
- **Use consistent naming**: `SESSION-HANDOFF-[description]-[YYYY-MM-DD].md`
- **Update CLAUDE.md**: Always reflect current status and next priorities

### **Agent Consultation**

- **Architecture changes**: Consult `architecture-designer` for planning
- **Performance work**: Use `performance-optimizer` for prioritization
- **Security concerns**: Engage `security-validator` for assessment
- **Multi-domain**: Use multiple agents for comprehensive planning

## **Template Usage**

1. **Copy this checklist** when completing any major milestone
2. **Customize the session prompt** with your specific context
3. **Create the handoff document** following the naming convention
4. **Update CLAUDE.md** with reference to this template
5. **Archive old documentation** to keep workspace clean

This template ensures consistent, professional session transitions that enable productive continuation of work.
