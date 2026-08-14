document.addEventListener('DOMContentLoaded', () => {

    // 1. Mobile Navigation Toggle
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');
    const navItems = document.querySelectorAll('.nav-links a');

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

    // 2. Active Navigation Indicator
    const sections = document.querySelectorAll('section');
    window.addEventListener('scroll', () => {
        let current = '';
        const scrollY = window.pageYOffset;

        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            // Adjust offset to trigger slightly before reaching the top
            if (scrollY >= (sectionTop - 200)) {
                current = section.getAttribute('id');
            }
        });

        navItems.forEach(a => {
            a.classList.remove('active');
            if (a.getAttribute('href').includes(current) && current !== '') {
                a.classList.add('active');
            }
        });
    });

    // 3. Reveal Animation on Scroll
    const reveals = document.querySelectorAll('.reveal');
    const revealOnScroll = () => {
        const windowHeight = window.innerHeight;
        const elementVisible = 100;

        reveals.forEach(reveal => {
            const elementTop = reveal.getBoundingClientRect().top;
            if (elementTop < windowHeight - elementVisible) {
                reveal.classList.add('active');
            }
        });
    };
    revealOnScroll(); // Trigger once on load
    window.addEventListener('scroll', revealOnScroll);

    // 4. Project Filtering
    const filterBtns = document.querySelectorAll('.filter-btn');
    const projectCards = document.querySelectorAll('.project-card');

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const filterValue = btn.getAttribute('data-filter');

            projectCards.forEach(card => {
                const category = card.getAttribute('data-category');
                
                if (filterValue === 'all' || filterValue === category) {
                    card.style.display = 'flex';
                    setTimeout(() => {
                        card.style.opacity = '1';
                        card.style.transform = 'translateY(0)';
                    }, 50);
                } else {
                    card.style.opacity = '0';
                    card.style.transform = 'translateY(20px)';
                    setTimeout(() => {
                        card.style.display = 'none';
                    }, 300);
                }
            });
        });
    });

    // 5. Back to Top Button
    const backToTopBtn = document.getElementById('back-to-top');
    if (backToTopBtn) {
        backToTopBtn.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }

    // 6. Terminal Typing Animation (Hero)
    const typeWriterOutput = document.getElementById('typewriter-output');
    if (typeWriterOutput) {
        const command = "whoami";
        const outputLines = [
            "Heri Purnama",
            "Student Developer",
            "Game Development",
            "Creative Programming"
        ];
        
        let i = 0;
        let isTyping = true;
        
        // Initial prompt setup
        typeWriterOutput.innerHTML = `<span class="cmd-prompt">heri@portfolio</span>:<span class="cmd-path">~</span>$ <span id="cmd-text"></span><span class="terminal-cursor"></span>`;
        const cmdText = document.getElementById('cmd-text');

        function typeCommand() {
            if (i < command.length) {
                cmdText.innerHTML += command.charAt(i);
                i++;
                setTimeout(typeCommand, 100);
            } else {
                setTimeout(showOutput, 500);
            }
        }

        function showOutput() {
            // Remove cursor from command line
            const cursor = document.querySelector('.terminal-cursor');
            if(cursor) cursor.remove();

            let outHTML = "<br><br>";
            outputLines.forEach(line => {
                outHTML += `> ${line}<br>`;
            });
            
            // Add new prompt line with cursor
            outHTML += `<br><span class="cmd-prompt">heri@portfolio</span>:<span class="cmd-path">~</span>$ <span class="terminal-cursor"></span>`;
            
            typeWriterOutput.innerHTML += outHTML;
        }

        // Start typing after a short delay
        setTimeout(typeCommand, 1000);
    }

    // 7. Cursor Parallax Interaction (Only for fine pointers like mice)
    if (window.matchMedia("(pointer: fine)").matches) {
        const parallaxElements = document.querySelectorAll('.parallax-element');
        
        document.addEventListener('mousemove', (e) => {
            const xAxis = (window.innerWidth / 2 - e.pageX) / 50;
            const yAxis = (window.innerHeight / 2 - e.pageY) / 50;
            
            parallaxElements.forEach(el => {
                // We keep existing transforms (like hover scale) intact as much as possible by using a wrapper approach or subtle translate
                el.style.transform = `translate(${xAxis}px, ${yAxis}px)`;
            });
        });
        
        // Reset when mouse leaves
        document.addEventListener('mouseleave', () => {
            parallaxElements.forEach(el => {
                el.style.transform = `translate(0px, 0px)`;
            });
        });
    }

    // 8. Easter Egg (Ctrl + Shift + ?)
    const easterEggOverlay = document.getElementById('easter-egg-overlay');
    const closeEasterEgg = document.getElementById('close-easter-egg');
    const easterEggContent = document.getElementById('easter-egg-content');
    let easterEggTriggered = false;

    document.addEventListener('keydown', (e) => {
        // Checking for Ctrl + Shift + ?
        if (e.ctrlKey && e.shiftKey && e.key === '?') {
            e.preventDefault();
            
            if (!easterEggOverlay.classList.contains('active')) {
                easterEggOverlay.classList.add('active');
                
                if (!easterEggTriggered) {
                    easterEggTriggered = true;
                    runEasterEggAnimation();
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

    function runEasterEggAnimation() {
        easterEggContent.innerHTML = `<span class="cmd-prompt">root@system</span>:<span class="cmd-path">/secret</span># <span id="secret-cmd"></span><span class="terminal-cursor" id="secret-cursor"></span>`;
        const secretCmd = document.getElementById('secret-cmd');
        const command = "whoami";
        let j = 0;

        function typeSecret() {
            if (j < command.length) {
                secretCmd.innerHTML += command.charAt(j);
                j++;
                setTimeout(typeSecret, 150);
            } else {
                setTimeout(showSecretOutput, 600);
            }
        }

        function showSecretOutput() {
            const scursor = document.getElementById('secret-cursor');
            if(scursor) scursor.remove();

            easterEggContent.innerHTML += `
                <br><br>
                Heri Purnama<br>
                Student Developer<br>
                Game Developer<br>
                Building things and learning along the way.<br><br>
                <span class="cmd-prompt">root@system</span>:<span class="cmd-path">/secret</span># <span class="terminal-cursor"></span>
            `;
        }

        setTimeout(typeSecret, 800);
    }
});
