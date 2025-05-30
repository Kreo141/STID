$(document).ready(function() {
    let LoginButton = $(".LoginButton");

    $(LoginButton).hover(
        function() {
            $(this).css({
                "color": "black", 
                "background-color": "yellow"
            });
        },
        function() {
            $(this).css({
                "color": "", 
                "background-color": ""
            });
        },
        function(){
            $(".Level1").css({
                "filter": "saturation(0)"
            })
        }
    );

    const canvas = document.getElementById("particleCanvas");
    const ctx = canvas.getContext("2d");

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles = [];
    const numParticles = 50;
    const colors = ["rgb(187, 170, 18)", "rgb(255, 255, 255)", "rgb(201, 236, 0)", "rgb(255, 255, 255)", "rgb(0, 128, 187)"];

    class Particle {
        constructor() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.radius = Math.random() * 5 + 2;
            this.color = colors[Math.floor(Math.random() * colors.length)];
            this.vx = (Math.random() - 0.5) * 2;
            this.vy = (Math.random() - 0.5) * 2;
        }

        move() {
            this.x += this.vx;
            this.y += this.vy;
            if (this.x <= 0 || this.x >= canvas.width) this.vx *= -1;
            if (this.y <= 0 || this.y >= canvas.height) this.vy *= -1;
        }

        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fillStyle = this.color;
            ctx.fill();
        }
    }

    function initParticles() {
        for (let i = 0; i < numParticles; i++) {
            particles.push(new Particle());
        }
    }

    function getClosest(particle) {
        return [...particles]
            .map(p => ({ p, d: Math.hypot(p.x - particle.x, p.y - particle.y) }))
            .sort((a, b) => a.d - b.d)
            .slice(1, 2)
            .map(p => p.p)[0];
    }

    function drawLines() {
        particles.forEach(p => {
            const closest = getClosest(p);
            if (!closest) return;

            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(closest.x, closest.y);

            const gradient = ctx.createLinearGradient(p.x, p.y, closest.x, closest.y);
            gradient.addColorStop(0, p.color);
            gradient.addColorStop(1, closest.color);

            ctx.strokeStyle = gradient;
            ctx.lineWidth = 1.5;
            ctx.stroke();
        });
    }

    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawLines();
        particles.forEach(p => {
            p.move();
            p.draw();
        });
        requestAnimationFrame(animate);
    }

    initParticles();
    animate();

    window.addEventListener("resize", () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        particles.length = 0;
        initParticles();
    });
});


