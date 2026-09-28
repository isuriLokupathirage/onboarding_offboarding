export const manifest = {
  screens: {
    scr_464ptg: { name: "Overview", route: "/onboarding/overview", position: { "x": 160, "y": 220 } },
    scr_5nxd8j: { name: "Transitions", route: "/onboarding/transitions", position: { "x": 1560, "y": 220 } },
    scr_yi1qbz: { name: "Transition – Tasks", route: "/onboarding/transitions/tr1", state: { "view": "tasks" }, position: { "x": 2960, "y": 220 } },
    scr_fqlim1: { name: "Transition – Emails", route: "/onboarding/transitions/tr1", state: { "view": "emails" }, position: { "x": 4360, "y": 220 } },
    scr_7fvoja: { name: "New Transition – Type", route: "/onboarding/transitions/new", state: { "step": 0 }, position: { "x": 5760, "y": 220 } },
    scr_ymm9lw: { name: "New Transition – Candidate", route: "/onboarding/transitions/new", state: { "step": 1, "templateId": "tpl1" }, position: { "x": 7160, "y": 220 } },
    scr_kux07h: { name: "New Transition – Tasks & Owners", route: "/onboarding/transitions/new", state: { "step": 2, "templateId": "tpl1" }, position: { "x": 8560, "y": 220 } },
    scr_k6sk4f: { name: "Templates – Onboarding Tasks", route: "/onboarding/templates", state: { "kind": "Onboarding", "view": "tasks" }, position: { "x": 160, "y": 2200 } },
    scr_8fhwxw: { name: "Templates – Onboarding Templates", route: "/onboarding/templates", state: { "kind": "Onboarding", "view": "templates" }, position: { "x": 1560, "y": 2200 } },
    scr_9x51nl: { name: "Templates – Offboarding Tasks", route: "/onboarding/templates", state: { "kind": "Offboarding", "view": "tasks" }, position: { "x": 2960, "y": 2200 } },
    scr_kptn38: { name: "Create Task", route: "/onboarding/templates/new-task", position: { "x": 4360, "y": 2200 } },
    scr_w8ivkn: { name: "Create Template – Basic Info", route: "/onboarding/templates/new-template", state: { "step": 0 }, position: { "x": 5760, "y": 2200 } },
    scr_su2o6v: { name: "Create Template – Add Tasks", route: "/onboarding/templates/new-template", state: { "step": 1, "seeded": true }, position: { "x": 7160, "y": 2200 } },
    scr_shrunx: { name: "Create Template – Review", route: "/onboarding/templates/new-template", state: { "step": 2, "seeded": true }, position: { "x": 8560, "y": 2200 } },
    scr_a99fk6: { name: "All Employees", route: "/employees", position: { "x": 160, "y": 4180 } },
    scr_5801ds: { name: "Employee – Basic Info", route: "/employees/emp1", state: { "tab": "basic" }, position: { "x": 1560, "y": 4180 } },
    scr_npfjp1: { name: "Employee – Form Access", route: "/employees/emp1", state: { "tab": "access" }, position: { "x": 2960, "y": 4180 } },
    scr_r1lgnr: { name: "Employee Forms", route: "/templates/forms/employee", position: { "x": 160, "y": 6160 } },
    scr_wx26x6: { name: "Form – Details", route: "/templates/forms/employee/frm1", state: { "tab": "details" }, position: { "x": 1560, "y": 6160 } },
    scr_uf15z8: { name: "Form – Employee Details", route: "/templates/forms/employee/frm1", state: { "tab": "employee" }, position: { "x": 2960, "y": 6160 } },
    scr_1dr3xv: { name: "Form – Required Documents", route: "/templates/forms/employee/frm1", state: { "tab": "documents" }, position: { "x": 4360, "y": 6160 } },
    scr_d5m2re: { name: "Form – Preview", route: "/templates/forms/employee/frm1", state: { "tab": "preview" }, position: { "x": 5760, "y": 6160 } },
    scr_z246i4: { name: "Form – Editing Fields", route: "/templates/forms/employee/frm1", state: { "tab": "employee", "editing": true }, position: { "x": 7160, "y": 6160 } },
    scr_rtg8jl: { name: "Background Check Forms", route: "/templates/forms/background-check", position: { "x": 160, "y": 8140 } },
    scr_m4bjs1: { name: "Recruitment Emails", route: "/templates/emails/recruitment", position: { "x": 160, "y": 10120 } },
    scr_wgdc0k: { name: "Candidate Portal – Data Form", route: "/portal/cnd-bc8f", state: { "tab": "form" }, position: { "x": 160, "y": 12100 } },
    scr_ubzu9b: { name: "Candidate Portal – Documents", route: "/portal/cnd-bc8f", state: { "tab": "documents" }, position: { "x": 1560, "y": 12100 } },
    scr_cnlfgi: { name: "Candidate Portal – My Events", route: "/portal/cnd-bc8f", state: { "tab": "events" }, position: { "x": 2960, "y": 12100 } },
    scr_m541t1: { name: "Candidate Portal – Revoked", route: "/portal/cnd-3aecb", position: { "x": 4360, "y": 12100 } },
    scr_nt92mc: { name: "Employee Link – Data Form", route: "/employee-form/asg1", state: { "tab": "form" }, position: { "x": 160, "y": 14080 } },
    scr_3p9fs4: { name: "Employee Link – Documents", route: "/employee-form/asg1", state: { "tab": "documents" }, position: { "x": 1560, "y": 14080 } },
    scr_ugx5in: { name: "Employee Link – Submitted", route: "/employee-form/asg2", position: { "x": 2960, "y": 14080 } },
    scr_knlg8z: { name: "Employee Link – Expired", route: "/employee-form/asg4", position: { "x": 4360, "y": 14080 } },
    scr_lxjszg: { name: "Employee Link – Revoked", route: "/employee-form/asg5", position: { "x": 5760, "y": 14080 } }
  },
  sections: {
    sec_h9tl61: { name: "Onboarding – Overview & Transitions", x: 0, y: 0, width: 9920, height: 1180 },
    sec_sv0spb: { name: "Onboarding – Templates", x: 0, y: 1980, width: 9920, height: 1180 },
    sec_gut05a: { name: "Employee Management", x: 0, y: 3960, width: 4320, height: 1180 },
    sec_luokg9: { name: "Form Templates – Employee", x: 0, y: 5940, width: 8520, height: 1180 },
    sec_ieuhgd: { name: "Form Templates – Other", x: 0, y: 7920, width: 1520, height: 1180 },
    sec_8pff57: { name: "Email Templates", x: 0, y: 9900, width: 1520, height: 1180 },
    sec_q5yje6: { name: "Candidate Portal", x: 0, y: 11880, width: 5720, height: 1180 },
    sec_mkpg06: { name: "Employee Form Links", x: 0, y: 13860, width: 7120, height: 1180 }
  },
  layers: [
  { kind: "section", id: "sec_h9tl61", children: [
    { kind: "screen", id: "scr_464ptg" },
    { kind: "screen", id: "scr_5nxd8j" },
    { kind: "screen", id: "scr_yi1qbz" },
    { kind: "screen", id: "scr_fqlim1" },
    { kind: "screen", id: "scr_7fvoja" },
    { kind: "screen", id: "scr_ymm9lw" },
    { kind: "screen", id: "scr_kux07h" }]
  },
  { kind: "section", id: "sec_sv0spb", children: [
    { kind: "screen", id: "scr_k6sk4f" },
    { kind: "screen", id: "scr_8fhwxw" },
    { kind: "screen", id: "scr_9x51nl" },
    { kind: "screen", id: "scr_kptn38" },
    { kind: "screen", id: "scr_w8ivkn" },
    { kind: "screen", id: "scr_su2o6v" },
    { kind: "screen", id: "scr_shrunx" }]
  },
  { kind: "section", id: "sec_gut05a", children: [
    { kind: "screen", id: "scr_a99fk6" },
    { kind: "screen", id: "scr_5801ds" },
    { kind: "screen", id: "scr_npfjp1" }]
  },
  { kind: "section", id: "sec_luokg9", children: [
    { kind: "screen", id: "scr_r1lgnr" },
    { kind: "screen", id: "scr_wx26x6" },
    { kind: "screen", id: "scr_uf15z8" },
    { kind: "screen", id: "scr_1dr3xv" },
    { kind: "screen", id: "scr_d5m2re" },
    { kind: "screen", id: "scr_z246i4" }]
  },
  { kind: "section", id: "sec_ieuhgd", children: [
    { kind: "screen", id: "scr_rtg8jl" }]
  },
  { kind: "section", id: "sec_8pff57", children: [
    { kind: "screen", id: "scr_m4bjs1" }]
  },
  { kind: "section", id: "sec_q5yje6", children: [
    { kind: "screen", id: "scr_wgdc0k" },
    { kind: "screen", id: "scr_ubzu9b" },
    { kind: "screen", id: "scr_cnlfgi" },
    { kind: "screen", id: "scr_m541t1" }]
  },
  { kind: "section", id: "sec_mkpg06", children: [
    { kind: "screen", id: "scr_nt92mc" },
    { kind: "screen", id: "scr_3p9fs4" },
    { kind: "screen", id: "scr_ugx5in" },
    { kind: "screen", id: "scr_knlg8z" },
    { kind: "screen", id: "scr_lxjszg" }]
  }]

};