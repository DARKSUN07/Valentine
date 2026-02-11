// Get elements
const yesBtn = document.getElementById('yes-btn');
const noBtn = document.getElementById('no-btn');
const message = document.getElementById('message');
const questionScreen = document.getElementById('question-screen');
const successScreen = document.getElementById('success-screen');

// Track the number of "no" attempts
let noCount = 0;
let isMoving = false;
let moveTimeout = null;
let targetPosition = { left: null, top: null };

// Original cute messages
const noMessages = [
    "Are you sure? 🥺",
    "Really? Think again! 💭",
    "Please? Just give me a chance! 🙏"
];

// Initialize button positions – perfectly aligned
function initButtonPositions() {
    const container = document.querySelector('.button-container');
    yesBtn.style.position = 'relative';
    yesBtn.style.left = 'auto';
    yesBtn.style.top = 'auto';
    noBtn.style.position = 'relative';
    noBtn.style.left = 'auto';
    noBtn.style.top = 'auto';
    noBtn.classList.remove('moving');
    noBtn.style.transform = 'none';
}

window.addEventListener('load', initButtonPositions);
window.addEventListener('resize', initButtonPositions);

// Yes click → celebration
yesBtn.addEventListener('click', () => {
    questionScreen.classList.remove('active');
    successScreen.classList.add('active');
    createConfetti();
});

// No click → grow Yes button, start moving after 3 clicks
noBtn.addEventListener('click', (e) => {
    e.preventDefault();
    
    if (noCount < 3) {
        message.textContent = noMessages[noCount];
        noCount++;
        
        const currentSize = 1 + (noCount * 0.2);
        yesBtn.style.transform = `scale(${currentSize})`;
        
        if (noCount >= 3) {
            isMoving = true;
            noBtn.classList.add('moving');
            
            const container = document.querySelector('.button-container');
            const containerRect = container.getBoundingClientRect();
            const noBtnRect = noBtn.getBoundingClientRect();
            
            noBtn.style.position = 'absolute';
            noBtn.style.left = (noBtnRect.left - containerRect.left) + 'px';
            noBtn.style.top = (noBtnRect.top - containerRect.top) + 'px';
            
            message.textContent = "You can't escape! Just say yes! 😄";
        }
    } else {
        message.textContent = "Nice try! 😜 Just say YES already!";
        teleportToSafeZone();
    }
});

// ---------- SMOOTH MOVEMENT (60fps) ----------
function smoothMoveTo(newLeft, newTop) {
    if (!isMoving) return;
    if (moveTimeout) cancelAnimationFrame(moveTimeout);
    
    targetPosition.left = newLeft;
    targetPosition.top = newTop;
    
    function animate() {
        if (!isMoving) return;
        
        let currentLeft = parseFloat(noBtn.style.left);
        let currentTop = parseFloat(noBtn.style.top);
        
        if (isNaN(currentLeft) || isNaN(currentTop)) {
            const container = document.querySelector('.button-container');
            const containerRect = container.getBoundingClientRect();
            const rect = noBtn.getBoundingClientRect();
            currentLeft = rect.left - containerRect.left;
            currentTop = rect.top - containerRect.top;
        }
        
        const leftDiff = targetPosition.left - currentLeft;
        const topDiff = targetPosition.top - currentTop;
        
        if (Math.abs(leftDiff) < 0.5 && Math.abs(topDiff) < 0.5) {
            noBtn.style.left = targetPosition.left + 'px';
            noBtn.style.top = targetPosition.top + 'px';
            return;
        }
        
        // Interpolate smoothly (20% per frame)
        const newLeft = currentLeft + leftDiff * 0.2;
        const newTop = currentTop + topDiff * 0.2;
        
        noBtn.style.left = newLeft + 'px';
        noBtn.style.top = newTop + 'px';
        
        moveTimeout = requestAnimationFrame(animate);
    }
    
    moveTimeout = requestAnimationFrame(animate);
}

// ---------- MOVEMENT BOUNDS ----------
function getMovementBounds() {
    const container = document.querySelector('.button-container');
    const containerRect = container.getBoundingClientRect();
    const btnWidth = noBtn.offsetWidth;
    const btnHeight = noBtn.offsetHeight;
    
    const margin = 5;
    const minX = margin;
    const minY = margin;
    const maxX = containerRect.width - btnWidth - margin;
    const maxY = containerRect.height - btnHeight - margin;
    
    return { minX, minY, maxX, maxY, containerRect };
}

// ---------- TELEPORT WHEN CORNERED ----------
function teleportToSafeZone() {
    if (!isMoving) return;
    const { minX, minY, maxX, maxY } = getMovementBounds();
    const newLeft = minX + Math.random() * (maxX - minX);
    const newTop = minY + Math.random() * (maxY - minY);
    smoothMoveTo(newLeft, newTop);
}

// ---------- ESCAPE ONLY WHEN VERY CLOSE (<45px) ----------
function escapeFromMouse(mouseX, mouseY) {
    if (!isMoving) return;
    
    const { minX, minY, maxX, maxY, containerRect } = getMovementBounds();
    
    let currentLeft = parseFloat(noBtn.style.left);
    let currentTop = parseFloat(noBtn.style.top);
    if (isNaN(currentLeft) || isNaN(currentTop)) {
        const rect = noBtn.getBoundingClientRect();
        currentLeft = rect.left - containerRect.left;
        currentTop = rect.top - containerRect.top;
    }
    
    const btnWidth = noBtn.offsetWidth;
    const btnHeight = noBtn.offsetHeight;
    
    const btnCenterX = containerRect.left + currentLeft + btnWidth/2;
    const btnCenterY = containerRect.top + currentTop + btnHeight/2;
    
    const distance = Math.hypot(mouseX - btnCenterX, mouseY - btnCenterY);
    
    const VERY_CLOSE_DISTANCE = 45;
    
    if (distance < VERY_CLOSE_DISTANCE) {
        let dx = btnCenterX - mouseX;
        let dy = btnCenterY - mouseY;
        
        if (distance > 0.01) {
            dx /= distance;
            dy /= distance;
        } else {
            dx = Math.random() * 2 - 1;
            dy = Math.random() * 2 - 1;
        }
        
        let moveDistance;
        if (distance < 15) moveDistance = 180;
        else if (distance < 25) moveDistance = 140;
        else if (distance < 35) moveDistance = 110;
        else moveDistance = 85;
        
        let newLeft = currentLeft + dx * moveDistance;
        let newTop = currentTop + dy * moveDistance;
        
        const cornerThreshold = 12;
        const atLeft = newLeft <= minX + cornerThreshold;
        const atRight = newLeft >= maxX - cornerThreshold;
        const atTop = newTop <= minY + cornerThreshold;
        const atBottom = newTop >= maxY - cornerThreshold;
        
        if ((atLeft || atRight) && (atTop || atBottom)) {
            teleportToSafeZone();
            return;
        }
        
        if (atLeft || atRight) {
            newLeft = atLeft ? minX : maxX;
            newTop = currentTop + (Math.random() * 120 - 60);
        }
        if (atTop || atBottom) {
            newTop = atTop ? minY : maxY;
            newLeft = currentLeft + (Math.random() * 120 - 60);
        }
        
        newLeft = Math.min(Math.max(newLeft, minX), maxX);
        newTop = Math.min(Math.max(newTop, minY), maxY);
        
        smoothMoveTo(newLeft, newTop);
    }
}

// Mouse tracking
document.addEventListener('mousemove', (e) => {
    if (isMoving) escapeFromMouse(e.clientX, e.clientY);
});

document.addEventListener('touchmove', (e) => {
    if (isMoving && e.touches.length) {
        const touch = e.touches[0];
        escapeFromMouse(touch.clientX, touch.clientY);
    }
});

// Confetti celebration
function createConfetti() {
    const colors = ['#ff0000', '#ff69b4', '#ff1493', '#ffc0cb', '#ff6347'];
    for (let i = 0; i < 60; i++) {
        setTimeout(() => {
            const confetti = document.createElement('div');
            confetti.style.position = 'fixed';
            confetti.style.width = '12px';
            confetti.style.height = '12px';
            confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.left = Math.random() * window.innerWidth + 'px';
            confetti.style.top = '-10px';
            confetti.style.borderRadius = '50%';
            confetti.style.pointerEvents = 'none';
            confetti.style.zIndex = '9999';
            confetti.style.opacity = Math.random() * 0.8 + 0.2;
            confetti.style.boxShadow = '0 0 10px rgba(255,255,255,0.8)';
            document.body.appendChild(confetti);
            
            let pos = -10;
            let rot = 0;
            const speed = 2 + Math.random() * 3;
            const drift = (Math.random() - 0.5) * 1.2;
            
            const fall = setInterval(() => {
                pos += speed;
                rot += 5;
                confetti.style.top = pos + 'px';
                confetti.style.transform = `rotate(${rot}deg) translateX(${drift * pos}px)`;
                if (pos > window.innerHeight + 20) {
                    clearInterval(fall);
                    confetti.remove();
                }
            }, 20);
        }, i * 12);
    }
}

// Keyboard shortcut
document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === 'y' || e.key === 'Y') yesBtn.click();
});

// Keep button in bounds on resize
window.addEventListener('resize', function() {
    if (isMoving) {
        const { minX, minY, maxX, maxY } = getMovementBounds();
        let left = parseFloat(noBtn.style.left);
        let top = parseFloat(noBtn.style.top);
        if (isNaN(left)) left = (minX + maxX) / 2;
        if (isNaN(top)) top = (minY + maxY) / 2;
        noBtn.style.left = Math.min(Math.max(left, minX), maxX) + 'px';
        noBtn.style.top = Math.min(Math.max(top, minY), maxY) + 'px';
    } else {
        initButtonPositions();
    }
});

// Cleanup
window.addEventListener('beforeunload', () => {
    if (moveTimeout) cancelAnimationFrame(moveTimeout);
});