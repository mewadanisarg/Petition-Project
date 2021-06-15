// console.log("Script is Running good..!");
// Defining and Slecting the context for the canvas
const canvas = $("canvas");
const ctx = canvas[0].getContext("2d");
let hidden = $("#signature");

// Drawing process
let isDrawing = false;

let signature;

// Mousedown event
canvas.on("mousedown", (e) => {
    console.log("mousedown is reponsing:");
    // Initiating the drawing
    isDrawing = true;
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.strokeStyle = "black";
    ctx.beginPath();
    ctx.moveTo(e.offsetX, e.offsetY);
    e.preventDefault();
});

// Mousemove event

canvas.on("mousemove", (e) => {
    // Drawing from the point of the mouse
    if (isDrawing) {
        ctx.lineTo(e.offsetX, e.offsetY);
        ctx.stroke();
    }
    e.preventDefault();
});

// Mouseup event
canvas.on("mouseup", (e) => {
    // Stop drawing
    isDrawing = false;
    ctx.closePath();
    //    storing the data of the signature
    signature = e.target.toDataURL();
    hidden.val(signature);
    console.log("on mouse up");
    console.log(signature);
});
