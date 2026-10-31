<?php include("../include/head.php") ?>
<?php include("../include/navbar.php") ?>
<?php include("../include/sidebar_superadmin.php") ?>
<?php
// $basePath = 'http://localhost/nayantara/nayantarafrontend';
// $basePath = 'http://65.0.164.127/nayantarafrontend';
require_once __DIR__ . '/../include/config.php'; $basePath = nt_base('https://nayantarabyspacs.co.in');

// $path = "http://localhost:8085";
// $path = "http://65.0.164.127:8000";
$path = nt_api('https://nayantarabyspacs.co.in');

?>

<script type="text/javascript">
async function getDepartment(t) {
    var id = t.value;
    let getName = await fetch('<?= $path ?>/api/get-department/' + id);
    getName = await getName.json();
    const departmentId = document.getElementById("department_id");
    departmentId.innerHTML = "<option value='' selected>All departments</option>";
    departmentId.innerHTML += (getName.data || []).map((data, index) =>
        `<option value=${data.id}>${data.name}</option>`
    ).join('');
};
</script>

<body class="bg2" data-sidebar="dark">
    <div class="page-content">
        <div class="container-fluid">
            <div class="row">
                <div class="col-12">
                    <div class="card">
                        <div class="header">
                            <div class="row mt-3 mr-2 ml-2">
                                <div class="col-md-6 text-left">
                                    <h5>Assign Plan</h5>
                                    <p class="nt-ap-sub">Give a franchise plan to one or more logged-in students.</p>
                                </div>
                                <div class="col-md-6 text-right">
                                    <button type="button" class="btn btn-primary" id="open_assign">
                                        <i class="bx bx-plus"></i> Assign Plan
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div class="card-body">
                            <div class="row">
                                <div class="form-group col-md-4">
                                    <label>Franchise</label>
                                    <select class="form-control" id="franchise_id" name="franchsie_id"
                                        onchange="getDepartment(this)"></select>
                                </div>
                                <div class="form-group col-md-3">
                                    <label>Department</label>
                                    <select class="form-control" id="department_id" name="department_id">
                                        <option value="" selected>All departments</option>
                                    </select>
                                </div>
                                <div class="col-md-2" style="display:flex">
                                    <div style="align-self: center;">
                                        <button type="submit" id="submit" name="submit"
                                            class="btn btn-primary create-btn">Submit</button>
                                    </div>
                                </div>
                            </div>
                            <div class="table-responsive">
                                <table id="datatable_student"
                                    class="table table-bordered dt-responsive nowrap filter-table-data"
                                    style="border-collapse: collapse; border-spacing: 0; width: 100%;">
                                    <thead>
                                        <tr>
                                            <th>S. No</th>
                                            <th>Student Name</th>
                                            <th>Student Roll No</th>
                                            <th>Contact Number</th>
                                            <th>Email</th>
                                            <th>House</th>
                                            <th>School</th>
                                        </tr>
                                    </thead>
                                    <tbody id="getStudents">
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    </div>


    <?php include("../include/foot.php") ?>
    <?php include("../include/footer.php") ?>

    <!-- Assign plan side sheet -->
    <div class="nt-sheet-root" id="assign_sheet" aria-hidden="true">
        <div class="nt-sheet-backdrop" data-sheet-close></div>
        <aside class="nt-sheet" role="dialog" aria-modal="true" aria-labelledby="sheet_title" tabindex="-1">
            <header class="nt-sheet-head">
                <div class="nt-sheet-titles">
                    <h5 id="sheet_title">Assign plan</h5>
                    <p id="sheet_sub">Step 1 of 4</p>
                </div>
                <button type="button" class="nt-sheet-close" data-sheet-close aria-label="Close">
                    <i class="bx bx-x"></i>
                </button>
            </header>
            <ol class="nt-steps" id="sheet_steps"></ol>
            <div class="nt-sheet-body" id="sheet_body"></div>
            <footer class="nt-sheet-foot" id="sheet_foot">
                <div class="nt-sheet-foot-info" id="sheet_info"></div>
                <div class="nt-sheet-foot-actions">
                    <button type="button" class="btn btn-light" id="sheet_back">Back</button>
                    <button type="button" class="btn btn-primary" id="sheet_next">Continue</button>
                </div>
            </footer>
        </aside>
    </div>

    <script type="text/javascript">
    var API = '<?= $path ?>';

    /* --------------------------------------------------------------- helpers */
    var escapeHtml = function(v) {
        return String(v == null ? '' : v).replace(/[&<>"']/g, function(c) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
        });
    };
    // student fields from /api/get-studentbyfranchise are already HTML-escaped by the API
    var plainText = function(html) {
        var d = document.createElement('div');
        d.innerHTML = html || '';
        return d.textContent;
    };
    var rupees = function(v) { return '₹' + Number(v || 0).toLocaleString('en-IN'); };
    var mins = function(m) { return Number(m || 0).toLocaleString('en-IN') + ' min'; };
    var plural = function(n, word) { return n.toLocaleString('en-IN') + ' ' + word + (n === 1 ? '' : 's'); };
    var getJson = function(url) { return fetch(url).then(function(r) { return r.json(); }); };

    /* ------------------------------------------------------------ page table */
    var franchises = [];

    getJson(API + '/api/get-franchiseid').then(function(res) {
        franchises = (res.data || []).map(function(f) { return { id: String(f.Id), name: f.franchiseName }; });
        $('#franchise_id').html("<option value='' selected disabled>--Select--</option>" +
            franchises.map(function(f) { return '<option value="' + f.id + '">' + escapeHtml(f.name) + '</option>'; }).join(''));

        // dashboard links: ?open=1 opens the sheet, &franchise_id= preselects the franchise
        var params = new URLSearchParams(location.search);
        if (franchises.some(function(x) { return x.id === params.get('franchise_id'); })) {
            $('#franchise_id').val(params.get('franchise_id'));
            getDepartment(document.getElementById('franchise_id'));
        }
        if (params.get('open') === '1') {
            var f = franchises.find(function(x) { return x.id === params.get('franchise_id'); });
            if (f) {
                chooseFranchise(f);
                S.step = 1;
            }
            openSheet();
        }
    });

    var table = $('#datatable_student').DataTable({
        dom: 'Bfrtip',
        pageLength: 25,
        buttons: [
            'copy', 'csv', 'excel', 'pdf', 'print'
        ],
        searching: true,
        processing: true,
        serverSide: true,
        serverMethod: 'get',
        ajax: {
            url: API + '/api/get-studentbyfranchise',
            data: function(d) {
                d.franchise_id = $('#franchise_id').val()
                d.id = $('#department_id').val()
            },
            dataType: "JSON",
        },
        aaSorting: [],
        columns: [
            { data: 'index' },
            { data: 'name' },
            { data: 'student_roll_no' },
            { data: 'contact' },
            { data: 'email' },
            { data: 'department_name' },
            { data: 'franchise_name' },
        ],
    });

    $('#submit').on('click', function() {
        table.draw();
    });

    /* ----------------------------------------------------------- side sheet */
    var STEPS = ['Franchise', 'Students', 'Plan', 'Review'];
    var S;  // sheet state

    function resetState(franchise) {
        S = {
            step: 0,
            franchise: franchise || null,      // { id, name }
            students: null,                    // null = not loaded, [] = none
            studentsError: false,
            department: '',
            selected: new Set(),
            plans: null,
            plansError: false,
            plan: null,
            franchiseQuery: '',
            studentQuery: '',
            saving: false,
            done: false,
        };
    }
    resetState();

    var $sheet = $('#assign_sheet');
    var $body = $('#sheet_body');
    var lastFocus = null;

    function openSheet() {
        if (S.done) resetState();
        // start from the franchise picked in the page filter, if any
        if (!S.franchise) {
            var pageFranchise = $('#franchise_id').val();
            var f = franchises.find(function(x) { return x.id === pageFranchise; });
            if (f) chooseFranchise(f);
        }
        lastFocus = document.activeElement;
        render();
        $sheet.addClass('open').attr('aria-hidden', 'false');
        document.documentElement.classList.add('nt-sheet-open');
        setTimeout(function() { $sheet.find('.nt-sheet').trigger('focus'); }, 50);
    }

    function closeSheet() {
        if (S.saving) return;
        $sheet.removeClass('open').attr('aria-hidden', 'true');
        document.documentElement.classList.remove('nt-sheet-open');
        if (S.done) resetState();
        if (lastFocus) lastFocus.focus();
    }

    $('#open_assign').on('click', openSheet);
    $sheet.on('click', '[data-sheet-close]', closeSheet);
    $(document).on('keydown', function(e) {
        if (e.key === 'Escape' && $sheet.hasClass('open')) closeSheet();
    });

    /* data */
    function chooseFranchise(f) {
        if (S.franchise && S.franchise.id === f.id) return;
        S.franchise = f;
        S.students = null; S.studentsError = false;
        S.plans = null; S.plansError = false;
        S.department = ''; S.studentQuery = '';
        S.selected = new Set();
        S.plan = null;
        loadStudents(f.id);
        loadPlans(f.id);
    }

    function loadStudents(id) {
        getJson(API + '/api/get-studentbyfranchise?draw=1&start=0&length=-1&franchise_id=' + encodeURIComponent(id))
            .then(function(res) {
                if (!S.franchise || S.franchise.id !== id) return;
                S.students = (res.aaData || []).map(function(r) {
                    return {
                        id: String(r._ref.student),
                        dept: String(r._ref.department || ''),
                        name: r.name || '—',
                        roll: r.student_roll_no,
                        deptName: r.department_name,
                    };
                });
                render();
            })
            .catch(function() {
                if (!S.franchise || S.franchise.id !== id) return;
                S.students = []; S.studentsError = true;
                render();
            });
    }

    function loadPlans(id) {
        getJson(API + '/api/get-plans/' + encodeURIComponent(id))
            .then(function(res) {
                if (!S.franchise || S.franchise.id !== id) return;
                S.plans = res.data || [];
                render();
            })
            .catch(function() {
                if (!S.franchise || S.franchise.id !== id) return;
                S.plans = []; S.plansError = true;
                render();
            });
    }

    /* step rules */
    function canLeave(step) {
        if (step === 0) return !!S.franchise;
        if (step === 1) return S.selected.size > 0;
        if (step === 2) return !!S.plan;
        return true;
    }
    function maxReachable() {
        var i = 0;
        while (i < STEPS.length - 1 && canLeave(i)) i++;
        return i;
    }

    /* rendering */
    function emptyState(icon, title, text) {
        return '<div class="nt-ap-empty"><i class="bx ' + icon + '"></i><strong>' + title + '</strong>' +
            (text ? '<span>' + text + '</span>' : '') + '</div>';
    }
    function loadingState(text) {
        return '<div class="nt-ap-empty is-loading"><i class="bx bx-loader-alt bx-spin"></i><strong>' + text + '</strong></div>';
    }

    function render() {
        renderSteps();
        if (S.done) renderDone();
        else [renderFranchiseStep, renderStudentStep, renderPlanStep, renderReviewStep][S.step]();
        renderFoot();
    }

    function renderSteps() {
        var reach = maxReachable();
        $('#sheet_sub').text(S.done ? 'Done' : 'Step ' + (S.step + 1) + ' of ' + STEPS.length + ' · ' + STEPS[S.step]);
        $('#sheet_steps').toggle(!S.done).html(STEPS.map(function(label, i) {
            var state = i === S.step ? 'is-current' : (i < S.step || (i <= reach && canLeave(i)) ? 'is-done' : '');
            var enabled = i <= reach && !S.saving;
            return '<li class="nt-step ' + state + '">' +
                '<button type="button" data-step="' + i + '"' + (enabled ? '' : ' disabled') + '>' +
                '<span class="nt-step-dot">' + (state === 'is-done' ? '<i class="bx bx-check"></i>' : (i + 1)) + '</span>' +
                '<span class="nt-step-label">' + label + '</span></button></li>';
        }).join(''));
    }

    $('#sheet_steps').on('click', 'button[data-step]', function() {
        S.step = Number($(this).data('step'));
        render();
    });

    /* step 1: franchise */
    function renderFranchiseStep() {
        $body.html(
            '<div class="nt-sheet-intro"><h6>Which franchise?</h6><p>Plans and students are listed per franchise.</p></div>' +
            '<div class="nt-sheet-search"><i class="bx bx-search"></i>' +
            '<input type="search" class="form-control" id="franchise_q" placeholder="Search franchises" value="' + escapeHtml(S.franchiseQuery) + '" autocomplete="off"></div>' +
            '<div class="nt-choice-list" id="franchise_list" role="radiogroup" aria-label="Franchise"></div>'
        );
        renderFranchiseList();
    }
    function renderFranchiseList() {
        var q = S.franchiseQuery.toLowerCase();
        var list = franchises.filter(function(f) { return f.name.toLowerCase().indexOf(q) !== -1; });
        if (!franchises.length) return $('#franchise_list').html(loadingState('Loading franchises…'));
        if (!list.length) return $('#franchise_list').html(emptyState('bx-search', 'No franchise matches “' + escapeHtml(S.franchiseQuery) + '”'));
        $('#franchise_list').html(list.map(function(f) {
            var on = S.franchise && S.franchise.id === f.id;
            return '<label class="nt-choice' + (on ? ' is-selected' : '') + '">' +
                '<input type="radio" name="sheet_franchise" value="' + f.id + '"' + (on ? ' checked' : '') + '>' +
                '<span class="nt-choice-avatar">' + escapeHtml(f.name.trim().charAt(0).toUpperCase()) + '</span>' +
                '<span class="nt-choice-text"><strong>' + escapeHtml(f.name) + '</strong></span>' +
                '<span class="nt-choice-radio"></span></label>';
        }).join(''));
    }
    $body.on('input', '#franchise_q', function() {
        S.franchiseQuery = this.value;
        renderFranchiseList();
    });
    $body.on('change', 'input[name="sheet_franchise"]', function() {
        var id = this.value;
        chooseFranchise(franchises.find(function(f) { return f.id === id; }));
        $('#franchise_list .nt-choice').removeClass('is-selected');
        $(this).closest('.nt-choice').addClass('is-selected');
        renderSteps(); renderFoot();
    });
    $body.on('dblclick', '.nt-choice', function() { goNext(); });

    /* step 2: students */
    function visibleStudents() {
        var q = S.studentQuery.toLowerCase();
        return (S.students || []).filter(function(s) {
            if (S.department && s.dept !== S.department) return false;
            if (!q) return true;
            return (plainText(s.name) + ' ' + plainText(s.roll)).toLowerCase().indexOf(q) !== -1;
        });
    }
    function renderStudentStep() {
        if (S.students === null) return $body.html(loadingState('Loading students…'));
        if (S.studentsError) return $body.html(emptyState('bx-error-circle', 'Couldn’t load students', 'Close this and try again.'));
        if (!S.students.length) {
            return $body.html(emptyState('bx-user-x', 'No logged-in students in ' + escapeHtml(S.franchise.name),
                'Plans can only be assigned to students who have logged in at least once.'));
        }
        var depts = {};
        S.students.forEach(function(s) { if (s.dept) depts[s.dept] = s.deptName; });
        var deptOptions = Object.keys(depts).map(function(id) {
            return '<option value="' + id + '"' + (S.department === id ? ' selected' : '') + '>' + depts[id] + '</option>';
        }).join('');

        $body.html(
            '<div class="nt-sheet-intro"><h6>Who gets the plan?</h6><p>' + plural(S.students.length, 'logged-in student') + ' in ' + escapeHtml(S.franchise.name) + '.</p></div>' +
            '<div class="nt-sheet-filters">' +
                '<div class="nt-sheet-search"><i class="bx bx-search"></i>' +
                '<input type="search" class="form-control" id="student_q" placeholder="Search name or roll no" value="' + escapeHtml(S.studentQuery) + '" autocomplete="off"></div>' +
                (Object.keys(depts).length > 1 ? '<select class="form-control" id="student_dept"><option value="">All departments</option>' + deptOptions + '</select>' : '') +
            '</div>' +
            '<div class="nt-list-bar"><label class="nt-check-all"><input type="checkbox" id="students_all"> <span id="students_all_label"></span></label>' +
            '<button type="button" class="nt-ap-link" id="students_clear">Clear selection</button></div>' +
            '<div class="nt-student-list" id="student_list"></div>'
        );
        renderStudentList();
    }
    function renderStudentList() {
        var list = visibleStudents();
        var picked = list.filter(function(s) { return S.selected.has(s.id); }).length;
        $('#students_all').prop('checked', list.length > 0 && picked === list.length)
            .prop('indeterminate', picked > 0 && picked < list.length).prop('disabled', !list.length);
        $('#students_all_label').text('Select all ' + (S.studentQuery || S.department ? 'shown ' : '') + '(' + list.length.toLocaleString('en-IN') + ')');
        $('#students_clear').toggle(S.selected.size > 0);
        if (!list.length) return $('#student_list').html(emptyState('bx-search', 'No students match these filters'));
        $('#student_list').html(list.map(function(s) {
            var on = S.selected.has(s.id);
            return '<label class="nt-student' + (on ? ' is-selected' : '') + '">' +
                '<input type="checkbox" value="' + s.id + '"' + (on ? ' checked' : '') + '>' +
                '<span class="nt-student-text"><strong>' + s.name + '</strong>' +
                '<span>' + (s.roll ? 'Roll ' + s.roll : 'No roll no') + (s.deptName ? ' · ' + s.deptName : '') + '</span></span></label>';
        }).join(''));
    }
    $body.on('input', '#student_q', function() { S.studentQuery = this.value; renderStudentList(); });
    $body.on('change', '#student_dept', function() { S.department = this.value; renderStudentList(); });
    $body.on('change', '#student_list input', function() {
        if (this.checked) S.selected.add(this.value); else S.selected.delete(this.value);
        $(this).closest('.nt-student').toggleClass('is-selected', this.checked);
        renderStudentList(); renderSteps(); renderFoot();
    });
    $body.on('change', '#students_all', function() {
        var on = this.checked;
        visibleStudents().forEach(function(s) { if (on) S.selected.add(s.id); else S.selected.delete(s.id); });
        renderStudentList(); renderSteps(); renderFoot();
    });
    $body.on('click', '#students_clear', function() {
        S.selected.clear();
        renderStudentList(); renderSteps(); renderFoot();
    });

    /* step 3: plan */
    function renderPlanStep() {
        if (S.plans === null) return $body.html(loadingState('Loading plans…'));
        if (S.plansError) return $body.html(emptyState('bx-error-circle', 'Couldn’t load plans', 'Close this and try again.'));
        if (!S.plans.length) {
            return $body.html(emptyState('bx-package', 'No active plans for ' + escapeHtml(S.franchise.name),
                'Create or activate one under <a href="manage_subscriptions.php">Subscriptions</a>, then come back.'));
        }
        $body.html(
            '<div class="nt-sheet-intro"><h6>Which plan?</h6><p>The plan’s talk time is added to each student’s balance.</p></div>' +
            '<div class="nt-ap-plans" role="radiogroup" aria-label="Plans">' + S.plans.map(function(p) {
                var on = S.plan && String(S.plan.id) === String(p.id);
                return '<label class="nt-ap-plan' + (on ? ' is-selected' : '') + '">' +
                    '<input type="radio" name="sheet_plan" value="' + escapeHtml(p.id) + '"' + (on ? ' checked' : '') + '>' +
                    '<span class="nt-ap-plan-check"><i class="bx bx-check"></i></span>' +
                    '<span class="nt-ap-plan-name" title="' + escapeHtml(p.plan_name) + '">' + escapeHtml(p.plan_name) + '</span>' +
                    '<span class="nt-ap-plan-price">' + rupees(p.price) + '</span>' +
                    '<span class="nt-ap-plan-meta"><i class="bx bx-time-five"></i> ' + mins(p.talk_time) + ' talk time</span>' +
                    '</label>';
            }).join('') + '</div>'
        );
    }
    $body.on('change', 'input[name="sheet_plan"]', function() {
        var id = this.value;
        S.plan = S.plans.find(function(p) { return String(p.id) === id; }) || null;
        $body.find('.nt-ap-plan').removeClass('is-selected');
        $(this).closest('.nt-ap-plan').addClass('is-selected');
        renderSteps(); renderFoot();
    });

    /* step 4: review */
    function renderReviewStep() {
        var n = S.selected.size;
        var chosen = (S.students || []).filter(function(s) { return S.selected.has(s.id); });
        var shown = chosen.slice(0, 6);
        $body.html(
            '<div class="nt-sheet-intro"><h6>Review and assign</h6><p>Check the details before assigning. This can’t be undone from here.</p></div>' +
            '<div class="nt-review">' +
                reviewRow('Franchise', escapeHtml(S.franchise.name), 0) +
                reviewRow('Plan', '<strong>' + escapeHtml(S.plan.plan_name) + '</strong><span>' + rupees(S.plan.price) + ' · ' + mins(S.plan.talk_time) + ' talk time</span>', 2) +
                reviewRow('Students', '<strong>' + plural(n, 'student') + '</strong><span class="nt-review-names">' +
                    shown.map(function(s) { return s.name; }).join(', ') +
                    (chosen.length > shown.length ? ' and ' + (chosen.length - shown.length).toLocaleString('en-IN') + ' more' : '') + '</span>', 1) +
            '</div>' +
            '<div class="nt-review-total"><i class="bx bx-time-five"></i><span>Each student gets <strong>+' + mins(S.plan.talk_time) +
                '</strong> of talk time (' + mins(S.plan.talk_time * n) + ' in total).</span></div>'
        );
    }
    function reviewRow(label, value, step) {
        return '<div class="nt-review-row"><span class="nt-review-label">' + label + '</span>' +
            '<div class="nt-review-value">' + value + '</div>' +
            '<button type="button" class="nt-ap-link" data-goto="' + step + '">Change</button></div>';
    }
    $body.on('click', '[data-goto]', function() { S.step = Number($(this).data('goto')); render(); });

    /* done */
    function renderDone() {
        $body.html(
            '<div class="nt-sheet-done"><span class="nt-sheet-done-icon"><i class="bx bx-check"></i></span>' +
            '<h6>Plan assigned</h6><p><strong>' + escapeHtml(S.done.plan) + '</strong> was assigned to ' + plural(S.done.count, 'student') +
            ' in ' + escapeHtml(S.done.franchise) + '.</p></div>'
        );
    }

    /* footer */
    function renderFoot() {
        var info = '';
        if (S.done) info = '';
        else if (S.step === 0) info = S.franchise ? escapeHtml(S.franchise.name) : 'Select a franchise';
        else if (S.step === 1) info = S.selected.size ? plural(S.selected.size, 'student') + ' selected' : 'Select at least one student';
        else if (S.step === 2) info = S.plan ? escapeHtml(S.plan.plan_name) + ' · ' + rupees(S.plan.price) : 'Select a plan';
        $('#sheet_info').html(info);

        var $back = $('#sheet_back'), $next = $('#sheet_next');
        if (S.done) {
            $back.text('Assign another').show().prop('disabled', false);
            $next.text('Done').prop('disabled', false);
            return;
        }
        $back.text('Back').toggle(S.step > 0).prop('disabled', S.saving);
        if (S.step === STEPS.length - 1) {
            $next.prop('disabled', S.saving).html(S.saving
                ? '<i class="bx bx-loader-alt bx-spin"></i> Assigning…'
                : 'Assign to ' + plural(S.selected.size, 'student'));
        } else {
            $next.prop('disabled', !canLeave(S.step)).html('Continue <i class="bx bx-right-arrow-alt"></i>');
        }
    }

    function goNext() {
        if (S.done) return closeSheet();
        if (S.step === STEPS.length - 1) return submit();
        if (!canLeave(S.step)) return;
        S.step++;
        render();
        $body.scrollTop(0);
    }
    $('#sheet_next').on('click', goNext);
    $('#sheet_back').on('click', function() {
        if (S.done) {
            var f = S.franchise;
            resetState(); chooseFranchise(f); S.step = 1;
            return render();
        }
        if (S.step > 0) { S.step--; render(); }
    });

    function submit() {
        if (S.saving || !S.plan || !S.selected.size) return;
        S.saving = true;
        renderSteps(); renderFoot();
        $.ajax({
            url: API + '/api/plan-purchase',
            type: 'POST',
            data: {
                studentid: JSON.stringify(Array.from(S.selected)),
                planid: S.plan.id
            },
            dataType: 'json',
            success: function(data) {
                S.saving = false;
                if (data.error == true) {
                    Swal.fire('Couldn’t assign', data.message, 'error');
                    return render();
                }
                S.done = { plan: S.plan.plan_name, count: S.selected.size, franchise: S.franchise.name };
                render();
                table.draw(false);
            },
            error: function() {
                S.saving = false;
                Swal.fire('Couldn’t assign', 'The server didn’t respond. Please try again.', 'error');
                render();
            }
        });
    }
    </script>
