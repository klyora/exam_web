async function fetchTutors() {
  try {
    const response = await fetch(
      `http://cat-facts-api.std-900.ist.mospolytech.ru/api/tutors?api_key=1351c78e-5afb-4126-9d17-5925335ee1e6`
    );
    if (!response.ok) {
      throw new Error("Failed to fetch tutors");
    }
    const tutors = await response.json();
    return tutors;
  } catch (error) {
    console.error("Error fetching tutors:", error);
    return [];
  }
}

function renderTutors(tutors) {
  const tutorList = document.getElementById("tutor-list");
  tutorList.innerHTML = "";

  if (tutors.length === 0) {
    tutorList.innerHTML = `
      <div class="col-12">
        <div class="alert alert-warning" role="alert">
          No tutors found.
        </div>
      </div>`;
    return;
  }

  tutors.forEach((tutor) => {
    const card = document.createElement("div");
    card.className = "col-md-4";

    card.innerHTML = `
      <div class="card">
        <div class="card-body">
          <h5 class="card-title">${tutor.name}</h5>
          <p class="card-text">Experience: ${
            tutor.work_experience || "N/A"
          } years</p>
          <p class="card-text">Languages: ${tutor.languages_offered.join(
            ", "
          )}</p>
          <p class="card-text">Base Price per hour: ${
            tutor.price_per_hour
          } RUB</p>
          <button class="btn btn-primary book-tutor-button" data-bs-toggle="modal" data-bs-target="#bookTutorModal" data-id="${
            tutor.id
          }">Book</button>
        </div>
      </div>`;

    const bookButton = card.querySelector(".book-tutor-button");
    bookButton.addEventListener("click", () => setupBookingForm(tutor));

    tutorList.appendChild(card);
  });
}

function setupBookingForm(tutor) {
  document.getElementById("selectedTutorName").value = tutor.name;

  const startDateSelect = document.getElementById("startDateTutor");
  startDateSelect.innerHTML = "";
  ["2025-02-15", "2025-03-04"].forEach((date) => {
    const option = document.createElement("option");
    option.value = date;
    option.textContent = new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    startDateSelect.appendChild(option);
  });

  const startTimeSelect = document.getElementById("startTimeTutor");
  startTimeSelect.innerHTML = "";
  ["09:00", "10:00", "11:00"].forEach((time) => {
    const option = document.createElement("option");
    option.value = time;
    option.textContent = time;
    startTimeSelect.appendChild(option);
  });

  const updatePrice = () => {
    const options = {
      supplementary: document.getElementById("supplementaryTutor").checked,
      excursions: document.getElementById("excursionsTutor").checked,
      assessment: document.getElementById("assessmentTutor").checked,
      interactive: document.getElementById("interactiveTutor").checked,
    };

    const selectedDate = document.getElementById("startDateTutor").value;
    const finalPrice = calculateTutorPrice(
      tutor.price_per_hour,
      options,
      selectedDate
    );
    document.getElementById(
      "finalPriceDisplay"
    ).innerHTML = `Final Price: ${finalPrice.toFixed(2)} RUB`;
  };

  startDateSelect.addEventListener("change", updatePrice);
  document
    .getElementById("supplementaryTutor")
    .addEventListener("change", updatePrice);
  document
    .getElementById("excursionsTutor")
    .addEventListener("change", updatePrice);
  document
    .getElementById("assessmentTutor")
    .addEventListener("change", updatePrice);
  document
    .getElementById("interactiveTutor")
    .addEventListener("change", updatePrice);

  updatePrice();

  const submitButton = document.getElementById("submitOrderButton");
  submitButton.onclick = (e) => {
    e.preventDefault();

    const orderData = {
      tutor_id: tutor.id,
      course_id: 0,
      date_start: document.getElementById("startDateTutor").value,
      time_start: document.getElementById("startTimeTutor").value,
      persons: 1,
      price: parseFloat(document.getElementById("finalPriceDisplay").value),
      early_registration:
        new Date() < new Date(document.getElementById("startDateTutor").value),
      supplementary: document.getElementById("supplementaryTutor").checked,
      excursions: document.getElementById("excursionsTutor").checked,
      assessment: document.getElementById("assessmentTutor").checked,
      interactive: document.getElementById("interactiveTutor").checked,
      student_id: 7,
    };

    submitTutorOrder(orderData);
  };
}

function calculateTutorPrice(basePrice, options, selectedDate) {
  let price = basePrice;

  if (new Date(selectedDate) - new Date() > 30 * 24 * 60 * 60 * 1000) {
    price *= 0.9;
    document.getElementById("discountMessageTutor").innerHTML =
      "10% Early Registration Discount applied.<br>";
  } else {
    document.getElementById("discountMessageTutor").innerHTML = "";
  }

  if (options.supplementary) price += 2000;
  if (options.excursions) price *= 1.25;
  if (options.assessment) price += 300;
  if (options.interactive) price *= 1.5;

  return price;
}

async function submitTutorOrder(orderData) {
  try {
    const response = await fetch(
      `http://cat-facts-api.std-900.ist.mospolytech.ru/api/orders?api_key=1351c78e-5afb-4126-9d17-5925335ee1e6`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderData),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to submit order");
    }

    alert("Order submitted successfully!");
    const result = await response.json();
    console.log(result);
  } catch (error) {
    console.error("Error submitting order:", error);
    alert("Failed to submit order. Please try again.");
  }
}

fetchTutors().then(renderTutors);