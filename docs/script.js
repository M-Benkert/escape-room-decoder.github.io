let gameName = "Demo";
let currentStage = 0;
let mistakes = 0;
let solution = [[1, 2, 3, 4], [2, 3, 4, 5], [3, 4, 5, 6]];

const slots = ["slot1", "slot2", "slot3", "slot4"];

let slot_elements = slots.reduce((accumulator, slot) => {
    accumulator[slot] = {
        "element": null,
        "keyId": null
    };
    return accumulator;
}, {});


// Game functions *************************************************************
function loadGame() {


    // Set attribute values
    const storedGameName = getQueryString("game-name");
    if (storedGameName !== null) {
        gameName = storedGameName;
    }

    const storedCurrentStage = loadCurrentStage();
    if (storedCurrentStage !== null) {
        currentStage = parseInt(storedCurrentStage, 10);
    }
    setCurrentStage(currentStage);

    if (gameName) {
        fetch('games.json')
            .then(response => response.json())
            .then(data => {
                if (data.hasOwnProperty(gameName)) {
                    const gameDetails = data[gameName];
                    $("#game-name").text(data[gameName]["title"]);
                    displayGameDetails(gameDetails);
                } else {
                    displayError(`Game "${gameName}" not found.`);
                }
            })
            .catch(error => console.error('Error loading JSON:', error));
    } else {
        displayError('No game specified in the query string.');
    }
}

function displayGameDetails(details) {
    solution = details["solution"];
}

function displayError(message) {
    console.log(message)
}

function setCurrentStage(value) {
    currentStage = value;
    saveCurrentStage();
    $("#current-stage").text(currentStage + 1);
}

function setMistakes(value) {
    mistakes = value;
    saveMistakes();

}

function showOverlay(overlayId) {
    document.getElementById(overlayId).style.display = 'block';
}

function hideOverlay(overlayId) {
    document.getElementById(overlayId).style.display = 'none';
}

// Game functions *************************************************************
function resetGame() {
    setCurrentStage(0);
}

function submitGuess() {
    if (!slots.every(slot => slot_elements[slot]["keyId"] !== null))
        return;

    if (!slots.every((slot, index) => {
        const guess = slot_elements[slot]["keyId"];
        return guess === solution[currentStage][index];
    })) {
        showOverlay("overlay2");
        return;
    }

        showOverlay("overlay1");
    setCurrentStage(currentStage + 1);
    removeAllKeysFromSlots();
}

function removeKeyFromSlot(elem) {
    const slot = $(elem).prev(".slot");
    removeKeyFromSlot2(slot);
}

function removeKeyFromSlot2(slot) {
    console.log(slot)
    const slotId = slot.data("id");

    if (slot_elements[slotId]["keyId"] !== null) {
        const keyId = slot_elements[slotId]["keyId"];

        slot.find(".key").remove();
        slot_elements[slotId]["keyId"] = null;

        console.log(`Key ${keyId} removed from ${slotId}`);
    }
}

function removeAllKeysFromSlots() {
    $(".slot").each((index, slot) => removeKeyFromSlot2($(slot)));
}

const keyAttributes = [
    "numbers",
    "letters",
    "shapes",
    "roman",
    "bits",
    "spikes",
    "arrows",
    "dots",
];
function switchKeyAttributes(shown) {
    if (keyAttributes.indexOf(shown) === -1)
        return

    $(".key").each((index, element) => {
        element.classList.add("hide");
    });
    $(`.key-${shown}`).each((index, element) => {
        element.classList.remove("hide");
    });
}

// Helper functions ***********************************************************
function getQueryString(param) {
	const queryString = window.location.search;
	const params = new URLSearchParams(queryString);
	return params.get(param);
}

const STORAGE_KEY_CURRENT_STAGE = "stage";
function saveCurrentStage() {
    localStorage.setItem(`${gameName}-${STORAGE_KEY_CURRENT_STAGE}`, toString(currentStage));
}

function loadCurrentStage() {
    return localStorage.getItem(`${STORAGE_KEY_CURRENT_STAGE}-${gameName}`);
}

const STORAGE_KEY_MISTAKES = "mistakes";
function saveMistakes() {
    localStorage.setItem(`${gameName}-${STORAGE_KEY_MISTAKES}`, toString(mistakes));
}


// On load ********************************************************************
$(document).ready(function() {
    // Store elements
    $(".slot").each(function(index, element) {
        const slotId = $(element).data("id");
        slot_elements[slotId]["element"] = element;
    });

    let draggedElement;

    // Event listeners for drag start
    $(document).on("dragstart", ".key",function(event) {
        draggedElement = $(event.target).parent();
        event.originalEvent.dataTransfer.setData("text/html", draggedElement.outerHTML);
    });

    // Event listeners for drag over
    $(".slot").on("dragover", function(event) {
        event.preventDefault();
    });

    // Event listeners for drop
    $(".slot").on("drop", function(event) {
        event.preventDefault();

        // Check if the slot is empty
        if ($(this).children().length === 0 && draggedElement.parentElement !== this) {
            // Remove the dragged element from its current parent if it's being moved from a slot
            const elem = $(draggedElement).parent()
            if (elem.hasClass("slot")) {
                $(draggedElement).remove();

                const keyId = $(draggedElement).data("id");
                const slotId = $(elem).data("id");
                slot_elements[slotId]["keyId"] = null;

                console.log(`Key ${keyId} removed from ${slotId}`);
            }

            // Clone the dragged element and append it to the slot
            let clonedElement = $(draggedElement).clone().attr("draggable", "true").css("position", "relative");
            $(this).append(clonedElement);

            // Add dragstart event listener to the cloned element
            clonedElement.on("dragstart", function(event) {
                draggedElement = event.target;
                event.originalEvent.dataTransfer.setData("text/html", draggedElement.outerHTML);
            });

            // Get the data id of the dropped key and the slot
            const keyId = $(draggedElement).data("id");
            const slotId = $(this).data("id");
            slot_elements[slotId]["keyId"] = keyId;
            
            console.log(`Key ${keyId} dropped into ${slotId}`);
        }
    });

    // Event listener for drag over outside slots to allow dropping
    $(document).on("dragover", function(event) {
        event.preventDefault();
    });

    // Event listener for drop outside slots to remove the dragged element
    $(document).on("drop", function(event) {
        event.preventDefault();

        if (!$(event.target).closest(".slot").length) {
            const elem = $(draggedElement).parent();
            if (elem.hasClass("slot")) {
                $(draggedElement).remove();

                const keyId = $(draggedElement).data("id");
                const slotId = $(elem).data("id");
                slot_elements[slotId]["keyId"] = null;

                console.log(`Key ${keyId} removed from ${slotId}`);
            }
        }
    });

    loadGame();
});
