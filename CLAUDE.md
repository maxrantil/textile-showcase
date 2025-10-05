# Development Guidelines

## ✅ **PROJECT STATUS: CI/CD FULLY STABILIZED - ISSUE #48 COMPLETE**

**🎉 ISSUE #48 CI/CD STABILIZATION**: ✅ **FULLY COMPLETE**
**✅ PRODUCTION STATUS**: Site idaromme.dk ONLINE - Performance 0.72 (exceeds 0.7 threshold)
**Current Branch**: `master` (clean, ready for Issue #45)
**Strategic Planning**: ✅ **COMPLETE** with 3 remaining issues prioritized

**🚀 MAJOR ACHIEVEMENT: CI/CD PIPELINE FULLY STABILIZED**

**CI/CD Status: Fully Non-Blocking** ✅ **(all workflows passing)**

- **Issue #48**: ✅ **COMPLETE** - CI/CD pipeline fully stabilized (PR #59)
- **Lighthouse CI**: Fixed NaN assertion errors + non-blocking configuration
- **Performance Budget**: All checks passing (non-blocking)
- **GitHub Actions**: Workflows properly non-blocking, failures don't block deployment

**🏗️ STRATEGIC ROADMAP: REMAINING ISSUES**

**Execution Order (3 Issues Remaining):**

- **✅ [ORDER 1] Issue #46**: Production deployment validation ✅ **COMPLETE**
- **✅ [ORDER 2] Issue #47**: Performance optimizations ✅ **COMPLETE**
- **✅ [ORDER 3] Issue #48**: CI/CD improvements ✅ **COMPLETE** (2025-10-05)
- **🔒 [ORDER 4] Issue #45**: Security implementation (CRITICAL) **(NEXT - 3-4 hours)**
- **🎨 [ORDER 5] Issue #50**: Portfolio-focused optimization (STRATEGIC)
- **🔍 [ORDER 6] Issue #49**: 8-agent comprehensive audit (FINAL)

**📋 NEXT SESSION IMMEDIATE PRIORITY:**

**Issue #45: Security Implementation** (3-4 hours)

- Implement CSP headers and security middleware
- API security hardening (rate limiting, validation)
- Security audit logging system
- Vulnerability mitigation (tracked npm audit issues)
- **Target**: Comprehensive security hardening

**🎯 STRATEGIC BENEFITS:**

- Critical security foundation before final optimizations
- Resolves 16 tracked vulnerabilities (14 low, 1 moderate, 1 high)
- Enables secure portfolio operations
- Prepares for final comprehensive audit (Issue #49)

**📚 KEY DOCUMENTATION**:

- `docs/implementation/SESSION-HANDOFF-LIGHTHOUSE-CI-FIX-2025-10-05.md` ✅ Issue #48 complete
- `docs/implementation/ISSUE-48-CICD-IMPROVEMENTS-SESSION-2025-10-04.md` ✅ Issue #48 initial work
- `docs/implementation/ISSUE-46-PRODUCTION-DEPLOYMENT-VALIDATION-2025-10-02.md` ✅ Issue #46 complete
- `docs/implementation/FINAL-SESSION-HANDOFF-2025-10-01.md` ✅ Issue #40 complete
- `docs/implementation/STRATEGIC-ISSUE-ROADMAP-2025-10-01.md` ✅ Architecture-agent roadmap
- `.performance-baseline-production.json` ✅ Production metrics baseline
- All GitHub issues updated with execution order priorities ✅

---

## 🚨 QUICK START CHECKLIST

**Before ANY work:**

1. **PRD/PDR Required?** New features/UX changes → PRD first. Approved PRDs → PDR next.
2. **GitHub Issue** (after PRD/PDR if applicable)
3. **Feature Branch** (`feat/issue-123-description`) - NEVER commit to master
4. **Agent Analysis** (see trigger rules below)
5. **TDD Cycle** (failing test → minimal code → refactor)
6. **Draft PR** (early visibility)
7. **Agent Validation** (before marking ready)
8. **Close Issue** (verify completion)

---

## 1. WORKFLOW ESSENTIALS

#### **PRD/PDR Workflow:**

```
💡 Feature Request/Idea
    ↓
📋 PRD Creation → 🤖 **general-purpose-agent** → 👥 Stakeholders → ✅ Doctor Hubert Approval
    ↓
🏗️ PDR Creation → 🤖 **6 Core Agents:**
                    • architecture-designer
                    • security-validator
                    • performance-optimizer
                    • test-automation-qa
                    • code-quality-analyzer
                    • documentation-knowledge-manager
                 → 👨‍💻 Tech Review → ✅ Doctor Hubert Approval
    ↓
⚡ GitHub Issue Creation → Branch Creation → Implementation →
    🤖 **During Implementation:**
    • ux-accessibility-i18n-agent
    ↓
Draft PR →
    🤖 **Agent Review Checklist (MANDATORY):**
    • test-automation-agent (test strategy & coverage)
    • code-quality-analyzer
    • security-validator
    • performance-optimizer
    • architecture-designer (if structural)
    • ux-accessibility-i18n-agent (final check)
    • documentation-knowledge-manager (docs current & complete)
    • devops-deployment-agent (pre-deployment readiness)
    ↓
Testing → PR Ready for Review → Merge → Deployment
```

**Documents Location:**

- PRDs: `docs/implementation/PRD-[name]-[YYYY-MM-DD].md`
- PDRs: `docs/implementation/PDR-[name]-[YYYY-MM-DD].md`

### Git Workflow

**1. Planning Phase:**

- **Create GitHub issue ONLY after PRD/PDR approval** (if required)
- **Reference approved PRD/PDR documents** in issue description
- Issue describes implementation tasks, not requirements (requirements in PRD)

**2. Branch Setup:**

- **NEVER commit directly to `master`**
- Create descriptive branch: `fix/auth-timeout`, `feat/api-pagination`, `chore/ruff-fixes`
- Reference issue in branch name: `feat/issue-123-description`

**3. Development Phase:**

- **Document agent recommendations** in issue or PR description
- **Validate with secondary agents** for cross-functional concerns
- Make atomic commits (one logical change per commit)
- **NEVER use `--no-verify`** to bypass hooks
- **NEVER include co-author or tool attribution** - no `Co-authored-by:`, `Generated with Claude Code`, or similar mentions in commits/PRs

**4. Review Phase:**

- **Pull requests** for all changes (draft early, ready when complete)
- Use commit/PR messages like `Fixes #123` for auto-linking
- Squash only when merging to `master`; keep granular history on feature branch

**5. Completion Phase:**

- **Verify issue closure** after PR merge

### Test-Driven Development (NON-NEGOTIABLE)

1. **RED** - Write failing test first
2. **GREEN** - Minimal code to pass
3. **REFACTOR** - Improve while tests pass
4. **NEVER** write production code without failing test first

**Required test types**: Unit, Integration, End-to-End (no exceptions without explicit authorization)

---

## 2. AGENT INTEGRATION

**CONTEXT TRIGGERS:**

- Multi-file/system changes → `architecture-designer`
- Credentials, processes, network, files → `security-validator`
- All code modifications → `code-quality-analyzer`
- User interface mentions → `ux-accessibility-i18n-agent`
- Performance keywords (slow, optimize, timeout) → `performance-optimizer`
- Deploy/infrastructure mentions → `devops-deployment-agent`
- Test mentions, TDD workflow, coverage → `test-automation-qa`
- Documentation changes, README updates, phase docs → `documentation-knowledge-manager`

**VALIDATION (Post-Implementation):**
All relevant agents must validate final implementation

### Time Management

- **Agent disagreements**: Escalate to Doctor Hubert if >3 agents conflict
  **Quality thresholds**: Documentation ≥4.5, Security ≥4.0, Performance ≥3.5, Code Quality ≥4.0

### Decision Authority

**You can decide:**

- Technical implementation approaches within approved PDR
- Code structure and organization
- Test strategies and coverage

**Must ask Doctor Hubert:**

- Scope changes from original PRD/PDR
- Major architecture deviations
- Timeline extensions >1 day

### **Agent Usage Accountability**

**Doctor Hubert Enforcement Flags:**

- **"AGENT-AUDIT"**: Doctor Hubert can request full agent usage audit for any response
- **"MANDATORY-AGENTS"**: Triggers immediate agent analysis if Claude missed it
- **"CROSS-VALIDATE"**: Forces Claude to run all validation agents on current state

---

## 3. CODE STANDARDS

### Writing Principles

- Simple, maintainable solutions over clever ones
- Smallest reasonable changes
- Match surrounding code style
- **NEVER remove code comments unless provably false**
- **NEVER implement mock mode (use real data/APIs)**
- **NEVER name things 'improved', 'new', 'enhanced'** - be evergreen

### File Requirements

- All code files start with 2-line comment: `# ABOUTME: [description]`
- Evergreen comments (describe current state)
- Ask before reimplementing from scratch

### Pre-commit Hooks (MANDATORY)

- Install: `pre-commit install`
- **NEVER bypass with `--no-verify`**
- All commits must pass checks

---

## 4. PROJECT MANAGEMENT

### Documentation Standards

```
project-name/
├── README.md           # Living document - update after major changes
├── CLAUDE.md           # This file
├── src/                # Source code
├── tests/              # All test files
├── docs/
│   ├── implementation/ # PRDs, PDRs, phase docs
│   └── templates/      # GitHub templates
└── config/             # Configuration files
```

- **NEVER scatter .md files in root**

### Implementation Tracking

**MANDATORY: Mark phases as complete when finished**

**After Phase Completion**: Update implementation plan AND ensure related GitHub issues are closed with reference to completed work.

### **MANDATORY DOCUMENTATION REQUIREMENTS**

**Every phase MUST have documentation created during implementation:**

1. **Phase Documentation File**: `docs/implementation/PHASE-X-[name]-[YYYY-MM-DD].md`
2. **Real-time Updates**: Document decisions, blockers, and progress as work happens
3. **Session Continuity**: Enable easy pickup between sessions
4. **Consolidation**: Merge into comprehensive docs when phase completes
5. **Documentation-Knowledge-Manager Integration**: The `documentation-knowledge-manager` must validate all phase documentation before completion and ensure README.md updates occur within 24 hours of major changes. This agent works continuously with all other agents to maintain documentation accuracy and completeness.

**Documentation Must Include:**

- Implementation decisions and rationale
- Agent recommendations and validations
- Code changes and their impact
- Test results and coverage
- Blockers encountered and resolutions
- Next steps and dependencies

Format for active phases:

```markdown
## **PHASE X: NAME** 🔄 IN PROGRESS

_Started: Date_
_Documentation: docs/implementation/PHASE-X-[name]-[YYYY-MM-DD].md_

### Agent Validation Status:

- [ ] Architecture: Not started | In progress | ✅ Complete (structural foundation)
- [ ] Test Coverage: Not started | In progress | ✅ Complete (TDD emphasis)
- [ ] Code Quality: Not started | In progress | ✅ Complete (ongoing concern)
- [ ] Security: Not started | In progress | ✅ Complete (critical validation)
- [ ] Performance: Not started | In progress | ✅ Complete (optimization)
- [ ] Documentation: Not started | In progress | ✅ Complete (final state)

### Documentation Status:

- [ ] Phase doc created
- [ ] Implementation decisions documented
- [ ] Agent validations recorded
- [ ] Test results documented
- [ ] Ready for consolidation

**Complete when**: All agent validations pass ✅ AND documentation complete ✅
```

Format for completed phases:

```markdown
## **PHASE X: NAME** ✅ COMPLETE

_Completed: Date_
_Status: Brief summary_
_Documentation: Consolidated into [final-doc-name].md_

### X.1 Subsection ✅

- [x] **Task description** ✅
- [x] **Documentation** ✅
- **Complete when**: Criteria ✅ ACHIEVED
```

### README.md Requirements (Living Document)

Must include and keep updated:

Project description and current status
Installation and usage instructions
Development workflow
Testing instructions

**Update after**: Major features, phase completion, breaking changes

---

## 5. SESSION COMPLETION & HANDOFF PROCEDURES

### **MANDATORY Session Handoff Triggers**

**ALWAYS invoke the Session Handoff Template when ANY of these occur:**

- ✅ **Any GitHub issue closed/completed** (regardless of size)
- ✅ **Any PR merged to master**
- ✅ **Any phase/milestone completed**
- ✅ **Work session ending** (even if work incomplete)
- ✅ **Requesting strategic planning from agents**
- ✅ **Major documentation created** (PRD, PDR, architecture decisions)

**If you're unsure whether to trigger session handoff → TRIGGER IT**

### **MANDATORY Session Completion Protocol**

When triggered (see above), follow the **Session Handoff Template**:

📋 **Template Location**: `docs/templates/session-handoff-template.md`

**Key Requirements:**

1. **Complete 5-step checklist** (Issue completion → Documentation → Cleanup → Planning → Next session prep)
2. **Create session handoff document** following naming convention
3. **Archive old documentation** to keep workspace clean
4. **Generate 5-10 line session prompt** for Doctor Hubert using template format
5. **Consult relevant agents** for strategic planning when needed

### **Session Prompt Format**

```
Continue from [Issue/Achievement] completion ([brief status]).

**Immediate priority**: [Next issue/task] ([timeline])
**Context**: [Key achievement/current state]
**Reference docs**: [Essential documents to review]
**Ready state**: [Environment status, any cleanup notes]

**Expected scope**: [What the next session should accomplish]
```

**See `docs/templates/session-handoff-template.md` for complete checklist, examples, and best practices.**

---

## 6. EMERGENCY PROCEDURES

### When Things Break

1. **Stop current work**
2. **Create hotfix branch** from master
3. **Minimal fix only** (no scope creep)
4. **Fast-track PR** (notify Doctor Hubert)
5. **Post-mortem** after resolution

### Getting Help

- **Stuck on technical decision**: Ask Doctor Hubert
- **Agent conflicts**: Document and escalate
- **Timeline concerns**: Communicate early
- **Unclear requirements**: ALWAYS ask for clarification vs. assuming

---

## 6. TECHNOLOGY REFERENCES

@~/.claude/docs/python.md

@~/.claude/docs/using-uv.md

---

## Relationship & Communication

- Address as "Doctor Hubert"
- We're coworkers/teammates (I'm technically your boss, but collaborative)
- Irreverent humor welcome when not blocking work
- Use journaling capabilities to document interactions and progress
- Ask for help rather than struggling alone
- Any time you interact with me, you MUST address me as "Doctor Hubert"

## Key Reminders

- Do what's asked; nothing more, nothing less
- NEVER create files unless absolutely necessary
- ALWAYS prefer editing existing files
- NEVER proactively create documentation unless requested
- Pre-commit hooks are MANDATORY (no bypassing)
- Feature branches ONLY (never commit to master)
