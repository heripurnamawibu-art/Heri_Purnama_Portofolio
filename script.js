document.addEventListener('DOMContentLoaded', () => {
    'use strict';

    const mainTrack = document.getElementById('main-track');
    if (!mainTrack) return;

    const navItems = document.querySelectorAll('.nav-links a');
    const progressBar = document.getElementById('scroll-progress-bar');

    // -------------------------------------------------------------------------
    // 1. INFINITE CONTINUOUS LOOP ENGINE (Multi-Set Clones & Seamless Wrapping)
    // -------------------------------------------------------------------------
    const originalSections = Array.from(mainTrack.children);
    const originalCount = originalSections.length;

    // Helper to clone a section while sanitizing IDs
    function createSectionClone(item, cloneType) {
        const clone = item.cloneNode(true);
        const secId = item.getAttribute('id');
        if (secId) {
            clone.setAttribute('data-section-id', secId);
            clone.removeAttribute('id');
        }
        clone.querySelectorAll('[id]').forEach(el => {
            el.setAttribute('data-clone-id', el.id);
            el.removeAttribute('id');
        });
        clone.classList.add(`track-clone-${cloneType}`);
        return clone;
    }

    // Right Clone Set 1 & Right Clone Set 2 (for forward endless loop)
    originalSections.forEach(sec => mainTrack.appendChild(createSectionClone(sec, 'right-1')));
    originalSections.forEach(sec => mainTrack.appendChild(createSectionClone(sec, 'right-2')));

    // Left Clone Set (for backward endless loop)
    originalSections.slice().reverse().forEach(sec => {
        mainTrack.insertBefore(createSectionClone(sec, 'left'), mainTrack.firstChild);
    });

    let centerStartOffset = 0;
    let singleLoopWidth = 0;

    function calculateLoopDimensions() {
        const firstOriginal = originalSections[0];
        const lastOriginal = originalSections[originalCount - 1];

        if (firstOriginal && lastOriginal) {
            centerStartOffset = firstOriginal.offsetLeft;
            singleLoopWidth = (lastOriginal.offsetLeft + lastOriginal.offsetWidth) - firstOriginal.offsetLeft;
        }
    }

    // Calculate layout dimensions
    calculateLoopDimensions();
    mainTrack.scrollLeft = centerStartOffset;

    window.addEventListener('resize', () => {
        calculateLoopDimensions();
    });

    // Seamless Continuous Loop Jumps
    let isLooping = false;
    function handleLoopJump() {
        if (isLooping || singleLoopWidth <= 0) return;

        const currentX = mainTrack.scrollLeft;
        const forwardThreshold = centerStartOffset + singleLoopWidth;
        const backwardThreshold = centerStartOffset;

        if (currentX >= forwardThreshold) {
            isLooping = true;
            mainTrack.scrollLeft = currentX - singleLoopWidth;
            isLooping = false;
        } else if (currentX < backwardThreshold - 10) {
            isLooping = true;
            mainTrack.scrollLeft = currentX + singleLoopWidth;
            isLooping = false;
        }
    }

    mainTrack.addEventListener('scroll', handleLoopJump, { passive: true });

    // -------------------------------------------------------------------------
    // 2. UNCONDITIONAL MOUSE WHEEL HORIZONTAL SCROLLING
    // -------------------------------------------------------------------------
    window.addEventListener('wheel', (e) => {
        e.preventDefault();
        const delta = Math.abs(e.deltaY) >= Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
        mainTrack.scrollLeft += delta * 1.25;
    }, { passive: false });

    // -------------------------------------------------------------------------
    // 3. MOUSE DRAG / PANNING
    // -------------------------------------------------------------------------
    let isDown = false;
    let dragStartX = 0;
    let dragScrollStart = 0;

    mainTrack.addEventListener('mousedown', (e) => {
        if (e.target.closest('a, button, input, textarea, .filter-btn')) return;
        isDown = true;
        mainTrack.classList.add('grabbing');
        dragStartX = e.pageX - mainTrack.offsetLeft;
        dragScrollStart = mainTrack.scrollLeft;
    });

    window.addEventListener('mouseup', () => {
        isDown = false;
        mainTrack.classList.remove('grabbing');
    });

    mainTrack.addEventListener('mousemove', (e) => {
        if (!isDown) return;
        e.preventDefault();
        const x = e.pageX - mainTrack.offsetLeft;
        const walk = (x - dragStartX) * 1.6;
        mainTrack.scrollLeft = dragScrollStart - walk;
    });

    // -------------------------------------------------------------------------
    // 4. NAVBAR ACTIVE STATE & PROGRESS BAR
    // -------------------------------------------------------------------------
    function updateNavProgress() {
        if (singleLoopWidth <= 0) calculateLoopDimensions();

        const scrollX = mainTrack.scrollLeft;
        const relativeX = (scrollX - centerStartOffset + singleLoopWidth * 10) % singleLoopWidth;
        const progress = Math.min(Math.max(relativeX / singleLoopWidth, 0), 1);

        if (progressBar) {
            progressBar.style.width = `${progress * 100}%`;
        }

        // Find active section in the original loop
        let currentId = 'home';
        originalSections.forEach((item) => {
            const itemRelative = item.offsetLeft - centerStartOffset;
            if (relativeX >= itemRelative - window.innerWidth * 0.35) {
                const idAttr = item.getAttribute('id');
                if (idAttr) currentId = idAttr;
            }
        });

        // Update nav links active class
        navItems.forEach(a => {
            a.classList.remove('active');
            if (a.getAttribute('href') === `#${currentId}`) {
                a.classList.add('active');
            }
        });
    }

    mainTrack.addEventListener('scroll', updateNavProgress, { passive: true });
    updateNavProgress();

    // -------------------------------------------------------------------------
    // 5. NAV LINKS CLICK (Scroll to Nearest Section Instance)
    // -------------------------------------------------------------------------
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            const href = item.getAttribute('href');
            if (href && href.startsWith('#')) {
                e.preventDefault();
                const targetId = href.substring(1);
                
                // Find all matching instances across original and clones
                const instances = Array.from(
                    mainTrack.querySelectorAll(`section#${targetId}, section[data-section-id="${targetId}"]`)
                );
                if (instances.length === 0) return;

                const currentX = mainTrack.scrollLeft;
                let closestEl = instances[0];
                let minDiff = Math.abs(instances[0].offsetLeft - currentX);

                instances.forEach(el => {
                    const diff = Math.abs(el.offsetLeft - currentX);
                    if (diff < minDiff) {
                        minDiff = diff;
                        closestEl = el;
                    }
                });

                mainTrack.scrollTo({
                    left: closestEl.offsetLeft,
                    behavior: 'smooth'
                });
            }
        });
    });

    // Mobile Hamburger
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');
    if (hamburger && navLinks) {
        hamburger.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            hamburger.classList.toggle('active');
        });
        navItems.forEach(item => {
            item.addEventListener('click', () => {
                navLinks.classList.remove('active');
                hamburger.classList.remove('active');
            });
        });
    }

    // -------------------------------------------------------------------------
    // 6. KEYBOARD ARROW CONTROLS
    // -------------------------------------------------------------------------
    window.addEventListener('keydown', (e) => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

        if (e.key === 'ArrowRight' || e.key === 'PageDown') {
            e.preventDefault();
            mainTrack.scrollBy({ left: window.innerWidth * 0.75, behavior: 'smooth' });
        } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
            e.preventDefault();
            mainTrack.scrollBy({ left: -window.innerWidth * 0.75, behavior: 'smooth' });
        }
    });

    // -------------------------------------------------------------------------
    // 7. PROJECT FILTERING (Event Delegation)
    // -------------------------------------------------------------------------
    mainTrack.addEventListener('click', (e) => {
        const filterBtn = e.target.closest('.filter-btn');
        if (!filterBtn) return;

        const filterValue = filterBtn.getAttribute('data-filter');

        // Update all filter button tabs
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.toggle('active', btn.getAttribute('data-filter') === filterValue);
        });

        // Filter all project cards
        document.querySelectorAll('.project-card').forEach(card => {
            const category = card.getAttribute('data-category');
            if (filterValue === 'all' || filterValue === category) {
                card.style.display = 'flex';
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            } else {
                card.style.opacity = '0';
                card.style.transform = 'translateY(15px)';
                setTimeout(() => {
                    card.style.display = 'none';
                }, 200);
            }
        });

        setTimeout(calculateLoopDimensions, 250);
    });

    // -------------------------------------------------------------------------
    // 8. TERMINAL TYPING ANIMATION (Hero)
    // -------------------------------------------------------------------------
    const typeWriterOutputs = document.querySelectorAll('#typewriter-output, [data-clone-id="typewriter-output"]');
    typeWriterOutputs.forEach(output => {
        const command = "whoami";
        const outputLines = [
            "Heri Purnama",
            "Student Developer",
            "Game Development",
            "Creative Programming"
        ];

        let i = 0;
        output.innerHTML = `<span class="cmd-prompt">heri@portfolio</span>:<span class="cmd-path">~</span>$ <span class="cmd-text"></span><span class="terminal-cursor"></span>`;
        const cmdText = output.querySelector('.cmd-text');

        function typeCommand() {
            if (!cmdText) return;
            if (i < command.length) {
                cmdText.innerHTML += command.charAt(i);
                i++;
                setTimeout(typeCommand, 100);
            } else {
                setTimeout(showOutput, 500);
            }
        }

        function showOutput() {
            const cursor = output.querySelector('.terminal-cursor');
            if (cursor) cursor.remove();

            let outHTML = "<br><br>";
            outputLines.forEach(line => {
                outHTML += `> ${line}<br>`;
            });

            outHTML += `<br><span class="cmd-prompt">heri@portfolio</span>:<span class="cmd-path">~</span>$ <span class="terminal-cursor"></span>`;
            output.innerHTML += outHTML;
        }

        setTimeout(typeCommand, 800);
    });

    // -------------------------------------------------------------------------
    // 9. CURSOR PARALLAX INTERACTION (Hero)
    // -------------------------------------------------------------------------
    if (window.matchMedia("(pointer: fine)").matches) {
        document.addEventListener('mousemove', (e) => {
            const xAxis = (window.innerWidth / 2 - e.pageX) / 45;
            const yAxis = (window.innerHeight / 2 - e.pageY) / 45;

            document.querySelectorAll('.parallax-element').forEach(el => {
                el.style.transform = `translate(${xAxis}px, ${yAxis}px)`;
            });
        });

        document.addEventListener('mouseleave', () => {
            document.querySelectorAll('.parallax-element').forEach(el => {
                el.style.transform = `translate(0px, 0px)`;
            });
        });
    }

    // -------------------------------------------------------------------------
    // 10. EASTER EGG (Ctrl + Shift + ?)
    // -------------------------------------------------------------------------
    const easterEggOverlay = document.getElementById('easter-egg-overlay');
    const closeEasterEgg = document.getElementById('close-easter-egg');
    const easterEggContent = document.getElementById('easter-egg-content');
    let easterEggTriggered = false;

    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.shiftKey && e.key === '?') {
            e.preventDefault();
            if (!easterEggOverlay.classList.contains('active')) {
                easterEggOverlay.classList.add('active');
                if (!easterEggTriggered) {
                    easterEggTriggered = true;
                    runEasterEgg();
                }
            } else {
                easterEggOverlay.classList.remove('active');
            }
        }
    });

    if (closeEasterEgg) {
        closeEasterEgg.addEventListener('click', () => {
            easterEggOverlay.classList.remove('active');
        });
    }

    function runEasterEgg() {
        easterEggContent.innerHTML = `<span class="cmd-prompt">root@system</span>:<span class="cmd-path">/secret</span># <span id="secret-cmd"></span><span class="terminal-cursor" id="secret-cursor"></span>`;
        const secretCmd = document.getElementById('secret-cmd');
        const command = "whoami";
        let j = 0;

        function typeSecret() {
            if (j < command.length) {
                secretCmd.innerHTML += command.charAt(j);
                j++;
                setTimeout(typeSecret, 130);
            } else {
                setTimeout(showSecretOutput, 500);
            }
        }

        function showSecretOutput() {
            const scursor = document.getElementById('secret-cursor');
            if (scursor) scursor.remove();
            easterEggContent.innerHTML += `
                <br><br>
                Heri Purnama<br>
                Student Developer<br>
                Game Developer<br>
                Building things and learning along the way.<br><br>
                <span class="cmd-prompt">root@system</span>:<span class="cmd-path">/secret</span># <span class="terminal-cursor"></span>
            `;
        }

        setTimeout(typeSecret, 600);
    }
});
