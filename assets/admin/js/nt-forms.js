/*
 * Nayan Tara — form polish (loaded on every page from include/foot.php)
 *
 *  - Placeholders: any field without one (or with a generic "Enter ...") gets a specific
 *    placeholder based on its label, e.g. "Pincode" -> "6-digit PIN code".
 *  - Select prompts: a first option like "--Select--" becomes "Select state", "Select franchise"…
 *    (also for dropdowns that pages fill in later).
 *  - Hints: important fields in create/edit forms get a short helper line under the input.
 *
 * Wording lives in one dictionary below so every page and modal says the same thing.
 * Nothing here changes field names, ids or values.
 */
(function () {
    'use strict';

    /* label (normalised) -> { ph: placeholder, hint: helper text, noun: for "Select …" } */
    var FIELDS = {
        'email': { ph: 'name@example.com', icon: 'bx-envelope' },
        'email address': { ph: 'name@example.com', icon: 'bx-envelope' },
        'contact number': { ph: 'e.g. 9876543210', icon: 'bx-phone', hint: '10 digits, without +91 or spaces.' },
        'contact': { ph: 'e.g. 9876543210', icon: 'bx-phone' },
        'password': { ph: 'Enter password' },
        'confirm password': { ph: 'Repeat password', hint: 'Must match the password above.' },
        'parent name': { ph: "Parent's full name" },
        'student name': { ph: "Student's full name" },
        'student roll no': { ph: 'e.g. 1024', hint: 'Students sign in with this roll number.' },
        'roll number': { ph: 'e.g. 1024' },
        'franchise name': { ph: 'e.g. Scindia Fort Gwalior', hint: 'School or centre name shown across the panel.', noun: 'franchise' },
        'franchiser name': { ph: "Owner's full name", hint: 'Person who owns or runs this franchise.' },
        'address': { ph: 'Building, street, area' },
        'state': { noun: 'state' },
        'city': { noun: 'city', hintOnSelect: true, hint: 'Choose a state first.' },
        'pincode': { ph: '6-digit PIN code', icon: 'bx-map' },
        'remark': { ph: 'Optional note for your team' },
        'by plan permission': { noun: 'yes or no', hintOnSelect: true, hint: 'Yes lets this franchise assign plans to its students.' },
        'department name': { ph: 'e.g. Class 5 – Section A', hint: 'A group of students that share one calling device.', noun: 'department' },
        'device name': { ph: 'e.g. Tablet-01', hint: 'Name of the calling device installed in this department.' },
        'jitsi room url': { ph: 'https://meet.jit.si/room-name', icon: 'bx-link', hint: 'Video room used for this department’s calls.' },
        'plan name': { ph: 'e.g. Monthly 300 min', noun: 'plan' },
        'price': { ph: 'e.g. 199', prefix: '₹', hint: 'Amount in ₹ that parents pay for this plan.' },
        'talk time minutes': { ph: 'e.g. 300', suffix: 'min', hint: 'Total calling minutes included in the plan.' },
        'student available min': { ph: 'e.g. 120', suffix: 'min', hint: 'Sets the student’s remaining talk time, in minutes.' },
        'message': { ph: 'Type a message' },
        'parent login message': { ph: 'Message shown to parents when they sign in' },
        'emergency contact 1': { ph: 'e.g. 9876543210', icon: 'bx-phone' },
        'emergency contact 2': { ph: 'e.g. 9876543210', icon: 'bx-phone' },
        'emergency contact 3': { ph: 'e.g. 9876543210', icon: 'bx-phone' },
        'select date from': { ph: 'Start date', icon: 'bx-calendar' },
        'date from': { ph: 'Start date', icon: 'bx-calendar' },
        'to': { ph: 'End date', icon: 'bx-calendar' },
        'franchise': { noun: 'franchise' },
        'department': { noun: 'department' },
        'student': { noun: 'student' },
        'plan': { noun: 'plan' },
        'school name': { noun: 'your school' },
        'day': { noun: 'day' },
        'status': { noun: 'status' },
        'filter by department': { noun: 'department' },
        'move selected to department': { noun: 'department' },
        'set status of selected': { noun: 'status' }
    };

    var GENERIC_PH = /^(enter\s*\.*|enter here|\.\.\.|)$/i;
    var SELECT_PROMPT = /^[\s\-–—]*(select|choose)[\s\-–—.:]*$/i;

    function normalise(text) {
        return String(text || '')
            .replace(/\(optional\)/ig, '')
            .replace(/[*:.]/g, '')
            .replace(/^\s*(select|choose)\s+/i, '')
            .replace(/\s+/g, ' ')
            .trim()
            .toLowerCase();
    }

    function labelFor(el) {
        if (el.id) {
            var direct = document.querySelector('label[for="' + CSS.escape(el.id) + '"]');
            if (direct) return direct;
        }
        var group = el.closest('.form-group, [class*="col-"], .nt-toolbar-field');
        if (!group) return null;
        var labels = group.querySelectorAll('label:not(.error)');
        for (var i = labels.length - 1; i >= 0; i--) {
            // the label that comes before this field inside its group
            if (labels[i].compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING) return labels[i];
        }
        return null;
    }

    function lookup(label) {
        if (!label) return null;
        var key = normalise(label.textContent);
        if (FIELDS[key]) return { key: key, def: FIELDS[key] };
        var stripped = key.replace(/\s+\d+$/, ''); // "emergency contact 1" style fallbacks
        return FIELDS[stripped] ? { key: stripped, def: FIELDS[stripped] } : { key: key, def: null };
    }

    function sentence(key) {
        return key ? key.charAt(0).toLowerCase() + key.slice(1) : '';
    }

    function isFilterField(el) {
        return !!el.closest('.nt-auto-filter, .nt-toolbar, .dataTables_wrapper');
    }


    /* ------------------------------------------------ prefix / suffix / eye */

    function iconFor(el, type, def) {
        if (def && def.icon) return def.icon;
        if (type === 'password') return 'bx-lock-alt';
        if (type === 'email') return 'bx-envelope';
        if (type === 'tel') return 'bx-phone';
        if (type === 'url') return 'bx-link';
        if (el.classList.contains('hasDatepicker') || /(^|_)date$/i.test(el.id || '')) return 'bx-calendar';
        return null;
    }

    // Wraps a text-like input in .nt-input-group with optional prefix icon/text, suffix text and,
    // for passwords, one consistent show/hide button. The page's old eye toggles are hidden.
    function decorateInput(el, type, def) {
        if (el.closest('.nt-input-group, .nt-input-icon, .dataTables_filter, .nt-dt-length, .nt-tile-form')) return;
        var isPassword = type === 'password';
        // narrow grid columns (quarter width or less) keep the full width for the text: no icon
        var inFilterBar = !!el.closest('.nt-auto-filter') || !!(el.closest('.card-body > .row') && el.closest('.card-body > .row').querySelector('#submit'));
        var narrow = !inFilterBar && !!el.closest('.col-md-3, .col-md-2, .col-lg-3, .col-lg-2, .col-xl-3, .col-xl-2, .col-sm-3, .col-3, .col-2');
        var icon = narrow ? null : iconFor(el, type, def);
        var prefixText = def && def.prefix;
        var suffixText = def && def.suffix;
        if (!icon && !prefixText && !suffixText && !isPassword) return;

        var group = document.createElement('div');
        group.className = 'nt-input-group';
        el.parentNode.insertBefore(group, el);
        group.appendChild(el);

        if (prefixText || icon) {
            group.classList.add('has-prefix');
            var pre = document.createElement('span');
            pre.className = 'nt-affix nt-prefix';
            pre.setAttribute('aria-hidden', 'true');
            if (prefixText) pre.textContent = prefixText; else pre.innerHTML = '<i class="bx ' + icon + '"></i>';
            group.insertBefore(pre, el);
        }
        if (suffixText) {
            group.classList.add('has-suffix');
            var suf = document.createElement('span');
            suf.className = 'nt-affix nt-suffix';
            suf.setAttribute('aria-hidden', 'true');
            suf.textContent = suffixText;
            group.appendChild(suf);
        }
        if (isPassword) {
            group.classList.add('has-eye');
            var eye = document.createElement('button');
            eye.type = 'button';
            eye.className = 'nt-eye';
            eye.setAttribute('aria-label', 'Show password');
            eye.innerHTML = '<i class="bx bx-show"></i>';
            group.appendChild(eye);
            // hide the page's own toggle (absolutely positioned <span class="toggle-…">)
            var holder = group.parentNode;
            Array.prototype.forEach.call(holder.querySelectorAll('[class*="toggle-"], [onclick*="assword"]'), function (t) {
                if (t !== eye && !group.contains(t) && t.tagName !== 'INPUT') t.classList.add('nt-legacy-toggle');
            });
        }
    }

    document.addEventListener('click', function (e) {
        var eye = e.target.closest && e.target.closest('.nt-eye');
        if (!eye) return;
        var input = eye.parentNode.querySelector('input');
        var show = input.type === 'password';
        input.type = show ? 'text' : 'password';
        eye.innerHTML = '<i class="bx ' + (show ? 'bx-hide' : 'bx-show') + '"></i>';
        eye.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
        eye.classList.toggle('is-on', show);
    });

    // when a modal closes, passwords go back to hidden
    document.addEventListener('hidden.bs.modal', resetEyes, true);
    if (window.jQuery) window.jQuery(document).on('hidden.bs.modal', resetEyes);
    function resetEyes(e) {
        var scope = (e && e.target && e.target.querySelectorAll) ? e.target : document;
        Array.prototype.forEach.call(scope.querySelectorAll('.nt-eye.is-on'), function (eye) { eye.click(); });
    }

    function enhanceField(el) {
        if (el.getAttribute('data-nt-form') === '1') return;
        el.setAttribute('data-nt-form', '1');
        var type = (el.getAttribute('type') || el.tagName).toLowerCase();
        if (/^(hidden|checkbox|radio|submit|button|file|time|date|range|color)$/.test(type)) return;

        if (el.closest('.dataTables_filter')) {
            if (!el.getAttribute('placeholder')) el.setAttribute('placeholder', 'Search this table…');
            return;
        }
        var found = lookup(labelFor(el));
        var def = found && found.def;

        if (el.tagName === 'SELECT') {
            promptSelect(el, found);
        } else {
            if (el.tagName === 'INPUT') decorateInput(el, type, def);
            var ph = el.getAttribute('placeholder');
            if ((ph === null || GENERIC_PH.test(ph.trim())) && !el.disabled && !el.readOnly) {
                var text = def && def.ph;
                if (!text && found && found.key) {
                    text = type === 'number' ? 'Enter a number' : 'Enter ' + sentence(found.key);
                }
                if (text) el.setAttribute('placeholder', text);
            }
        }

        // hints that explain a thing belong where it is created (text fields), not on pickers
        if (def && def.hint && !isFilterField(el) && (el.tagName !== 'SELECT' || def.hintOnSelect)) {
            var group = el.closest('.form-group, [class*="col-"]') || el.parentNode;
            var scope = el.closest('.modal-body, form, .card-body') || document;
            var shown = Array.prototype.some.call(scope.querySelectorAll('.nt-hint'), function (h) { return h.textContent === def.hint; });
            if (!group.querySelector('.nt-hint') && !shown) { // each hint once per form
                var hint = document.createElement('small');
                hint.className = 'nt-hint';
                hint.textContent = def.hint;
                var hintId = (el.id || el.name || 'field') + '-hint';
                if (!document.getElementById(hintId)) {
                    hint.id = hintId;
                    el.setAttribute('aria-describedby', ((el.getAttribute('aria-describedby') || '') + ' ' + hintId).trim());
                }
                // at the end of the field group, so icons positioned after the input (password eye) stay put
                group.appendChild(hint);
            }
        }
    }

    function promptSelect(select, found) {
        var first = select.options[0];
        if (!first || !SELECT_PROMPT.test(first.text)) return;
        var noun = (found && found.def && found.def.noun) || (found && found.key) || '';
        var text = noun ? 'Select ' + sentence(noun) : 'Select an option';
        if (first.text !== text) first.text = text;
    }

    function scan(root) {
        var scope = root && root.querySelectorAll ? root : document;
        Array.prototype.forEach.call(scope.querySelectorAll('input, textarea, select'), function (el) {
            if (el.closest('.nt-palette-root, .nt-panel-root, .nt-sheet-root, .nt-dt-footer')) return;
            if (el.tagName === 'SELECT' && el.getAttribute('data-nt-form') === '1') {
                promptSelect(el, lookup(labelFor(el))); // options may have been re-filled
                return;
            }
            enhanceField(el);
        });
    }

    var queued = false;
    function queueScan() {
        if (queued) return;
        queued = true;
        requestAnimationFrame(function () { queued = false; scan(document); });
    }

    function start() {
        scan(document);
        // dropdowns are filled in by the pages after their API calls; modals are reused
        new MutationObserver(function (mutations) {
            for (var i = 0; i < mutations.length; i++) {
                var t = mutations[i].target;
                if (t.tagName === 'SELECT' || (t.querySelector && t.querySelector('input, select, textarea'))) { queueScan(); return; }
            }
        }).observe(document.body, { childList: true, subtree: true });
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
    else start();
})();
