const pages = [...document.querySelectorAll(".page")];
const dots = [...document.querySelectorAll("#dots i")];

let current = 0;

const totalPages = pages.length;

const progress = document.getElementById("progressBar");
const pageLabel = document.getElementById("pageLabel");
const prev = document.getElementById("prevButton");
const next = document.getElementById("nextButton");
const toast = document.getElementById("toast");



function saveLocally(item) {
    try {
        const saved = JSON.parse(
            localStorage.getItem("armelaAdventure") || "[]"
        );

        saved.push(item);

        localStorage.setItem(
            "armelaAdventure",
            JSON.stringify(saved)
        );

    } catch (error) {
        console.warn("Could not save activity locally:", error);
    }
}


function record(event, details = {}) {

    const item = {
        event: event,
        details: details,
        time: new Date().toISOString()
    };

    fetch("/api/response", {
        method: "POST",

        headers: {
            "Content-Type": "application/json"
        },

        body: JSON.stringify(item)

    })

    .then(response => {

        if (!response.ok) {
            throw new Error("Server could not save activity.");
        }

    })

    .catch(() => {

        saveLocally(item);

    });
}



let toastTimer;

function notify(message) {

    if (!toast) return;

    toast.textContent = message;

    toast.classList.add("show");

    clearTimeout(toastTimer);

    toastTimer = setTimeout(() => {

        toast.classList.remove("show");

    }, 1800);

}


function showPage(index) {

    if (totalPages === 0) return;

    current = Math.max(
        0,
        Math.min(totalPages - 1, index)
    );


    

    pages.forEach((page, i) => {

        page.classList.toggle(
            "active",
            i === current
        );

    });


   

    dots.forEach((dot, i) => {

        dot.classList.toggle(
            "current",
            i === current
        );

    });




    if (pageLabel) {

        pageLabel.textContent =
            String(current + 1).padStart(2, "0") +
            " / " +
            String(totalPages).padStart(2, "0");

    }


  

    if (progress) {

        progress.style.width =
            ((current + 1) / totalPages * 100) + "%";

    }



    if (prev) {

        prev.disabled = current === 0;

    }




    if (next) {

        next.disabled = current === totalPages - 1;

        next.style.visibility =
            current === totalPages - 1
                ? "hidden"
                : "visible";

    }


    record("page_view", {
        page: current + 1
    });



    const viewport = document.querySelector(".viewport");

    if (viewport) {

        viewport.scrollIntoView({
            behavior: "smooth",
            block: "nearest"
        });

    }

}



document.querySelectorAll("[data-next]").forEach(button => {

    button.addEventListener("click", () => {

        showPage(current + 1);

    });

});




if (prev) {

    prev.addEventListener("click", () => {

        showPage(current - 1);

    });

}




if (next) {

    next.addEventListener("click", () => {

        showPage(current + 1);

    });

}


dots.forEach((dot, i) => {

    dot.addEventListener("click", () => {

        if (i <= current) {

            showPage(i);

        }

    });

});



const maze = [

    "#########",
    "#P..#####",
    "###.#####",
    "###.#####",
    "###....##",
    "######.##",
    "######.##",
    "######...",
    "########G"

];


let player = {
    r: 1,
    c: 1
};

let mazeWon = false;

const mazeBoard = document.getElementById("mazeBoard");

const mazeStatus = document.getElementById("mazeStatus");

const mazeNext = document.getElementById("mazeNext");

const mazeReset = document.getElementById("mazeReset");




function drawMaze() {

    if (!mazeBoard) return;

    mazeBoard.innerHTML = "";

    maze.forEach((row, r) => {

        [...row].forEach((cell, c) => {

            const div = document.createElement("div");

            div.className =
                "cell " + (cell === "#" ? "wall" : "path");



            if (r === player.r && c === player.c) {

                div.classList.add("player");

                div.textContent = "✦";

            }

            

            else if (r === 8 && c === 8) {

                div.classList.add("goal");

                div.textContent = "●";

            }

            mazeBoard.appendChild(div);

        });

    });

}



function moveMaze(direction) {

    if (mazeWon) return;

    const directions = {

        up: [-1, 0],

        down: [1, 0],

        left: [0, -1],

        right: [0, 1]

    };


    const movement = directions[direction];

    if (!movement) return;


    const nr = player.r + movement[0];

    const nc = player.c + movement[1];




    if (
        nr < 0 ||
        nr > 8 ||
        nc < 0 ||
        nc > 8 ||
        maze[nr][nc] === "#"
    ) {

        return;

    }


    player = {
        r: nr,
        c: nc
    };


    drawMaze();


    

    if (nr === 8 && nc === 8) {

        mazeWon = true;

        if (mazeStatus) {

            mazeStatus.textContent =
                "Pearl found! The path is yours. ✦";

        }

        if (mazeNext) {

            mazeNext.disabled = false;

        }

        notify("You found the hidden pearl!");

        record("maze_completed");

    }

}




document.querySelectorAll("[data-move]").forEach(button => {

    button.addEventListener("click", () => {

        moveMaze(button.dataset.move);

    });

});




document.addEventListener("keydown", event => {

    if (current !== 1) return;

    const keyMap = {

        ArrowUp: "up",
        w: "up",

        ArrowDown: "down",
        s: "down",

        ArrowLeft: "left",
        a: "left",

        ArrowRight: "right",
        d: "right"

    };


    const direction = keyMap[event.key];

    if (direction) {

        event.preventDefault();

        moveMaze(direction);

    }

});




if (mazeReset) {

    mazeReset.addEventListener("click", () => {

        player = {
            r: 1,
            c: 1
        };

        mazeWon = false;

        if (mazeStatus) {

            mazeStatus.textContent = "Find the pearl ✦";

        }

        if (mazeNext) {

            mazeNext.disabled = true;

        }

        drawMaze();

        record("maze_reset");

    });

}


drawMaze();



let pearls = 0;

document.querySelectorAll(".pearl").forEach(button => {

    button.addEventListener("click", () => {

        if (button.classList.contains("collected")) return;


        button.classList.add("collected");

        pearls++;


        const pearlCount =
            document.querySelector("#pearlCount b");

        const pearlProgress =
            document.getElementById("pearlProgress");

        const pearlHint =
            document.getElementById("pearlHint");

        const pearlNext =
            document.getElementById("pearlNext");


        

        if (pearlCount) {

            pearlCount.textContent = pearls + " / 5";

        }



        if (pearlProgress) {

            pearlProgress.style.width =
                (pearls / 5 * 100) + "%";

        }


        record("pearl_collected", {
            total: pearls
        });



        if (pearls === 5) {

            if (pearlHint) {

                pearlHint.textContent =
                    "Every pearl found. Nicely done.";

            }

            if (pearlNext) {

                pearlNext.disabled = false;

            }

            notify("All five pearls collected!");

        }

    });

});



let boatPos = {
    x: 46,
    y: 45
};

let sailMoves = 0;


function moveBoat(direction) {

    const amount = 7;


    if (direction === "left") {

        boatPos.x = Math.max(5, boatPos.x - amount);

    }

    if (direction === "right") {

        boatPos.x = Math.min(88, boatPos.x + amount);

    }

    if (direction === "up") {

        boatPos.y = Math.max(7, boatPos.y - amount);

    }

    if (direction === "down") {

        boatPos.y = Math.min(78, boatPos.y + amount);

    }


    const boat = document.getElementById("mapBoat");

    const mapCoord = document.getElementById("mapCoord");

    const sailHint = document.getElementById("sailHint");


    if (boat) {

        boat.style.left = boatPos.x + "%";

        boat.style.top = boatPos.y + "%";

    }


    sailMoves++;


    if (mapCoord) {

        mapCoord.textContent =
            "POSITION: " +
            String(sailMoves + 1).padStart(2, "0");

    }


    if (sailHint) {

        sailHint.textContent =
            sailMoves >= 3
                ? "Captain's log: looking good out there."
                : "Keep exploring the water.";

    }


    record("boat_moved", {

        direction: direction,

        moves: sailMoves

    });

}



document.querySelectorAll("[data-sail]").forEach(button => {

    button.addEventListener("click", () => {

        moveBoat(button.dataset.sail);

    });

});



let starStep = 0;

const starPoints = [];

const starNodes = [
    ...document.querySelectorAll(".star-node")
];


starNodes.forEach(node => {

    node.addEventListener("click", () => {

        const number = Number(node.dataset.star);


       

        if (number !== starStep + 1) {

            const feedback =
                document.getElementById("starFeedback");

            if (feedback) {

                feedback.textContent =
                    "Not quite — look for star " +
                    (starStep + 1) + ".";

            }

            return;

        }


        starStep++;

        node.classList.add("done");


        

        const x =
            parseFloat(node.style.left) / 100 * 600;

        const y =
            parseFloat(node.style.top) / 100 * 260;


        starPoints.push(`${x},${y}`);


        const starLine =
            document.getElementById("starLine");

        const starFeedback =
            document.getElementById("starFeedback");



        if (starLine) {

            starLine.setAttribute(
                "points",
                starPoints.join(" ")
            );

        }


        if (starFeedback) {

            starFeedback.textContent =
                starStep === 5
                    ? "A constellation, made by you. ✦"
                    : `Beautiful. ${5 - starStep} more to connect.`;

        }


        record("star_connected", {
            number: number
        });


     

        if (starStep === 5) {

            const starNext =
                document.getElementById("starNext");

            if (starNext) {

                starNext.disabled = false;

            }

            notify("Constellation complete!");

        }

    });

});



const lilyButton =
    document.getElementById("lilyButton");


if (lilyButton) {

    lilyButton.addEventListener("click", () => {

        lilyButton.classList.add("bloomed");


        const lilyMessage =
            document.getElementById("lilyMessage");

        const lilyNext =
            document.getElementById("lilyNext");


        if (lilyMessage) {

            lilyMessage.textContent =
                "This flower better bloom or else. ✦";

        }


        if (lilyNext) {

            lilyNext.disabled = false;

        }


        record("lily_bloomed");

        notify("A little blue magic.");

    });

}



let declines = 0;


const yesButton =
    document.getElementById("yesButton");

const noButton =
    document.getElementById("noButton");


/* YES button. */

if (yesButton) {

    yesButton.addEventListener("click", () => {

        record("rsvp_yes", {
            answer: "Friday works"
        });


        const confirmed =
            document.getElementById("confirmed");


        if (confirmed) {

            confirmed.classList.remove("hidden");

        }


        notify("Friday night it is! 🎮");

    });

}



if (noButton) {

    noButton.addEventListener("click", () => {

        declines++;


        record("rsvp_not_available", {
            click: declines
        });


        const replies = [

            "No worries 😭 We can find another time.",

            "Saturday could still work, if that suits you.",

            "All good — no pressure at all. 😊"

        ];


        const finalReply =
            document.getElementById("finalReply");


        if (finalReply) {

            finalReply.textContent =
                replies[Math.min(declines - 1, 2)];

        }

    });

}


/* Replay button. */

const replayButton =
    document.getElementById("replayButton");


if (replayButton) {

    replayButton.addEventListener("click", () => {

        const confirmed =
            document.getElementById("confirmed");


        if (confirmed) {

            confirmed.classList.add("hidden");

        }


        showPage(0);

    });

}




record("adventure_started");



showPage(0);
