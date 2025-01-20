let currentPage = 1;
const coursesPerPage = 3;

async function fetchCourses() {
  try {
    const response = await fetch(
      `http://cat-facts-api.std-900.ist.mospolytech.ru/api/courses?api_key=1351c78e-5afb-4126-9d17-5925335ee1e6`
    );
    if (!response.ok) {
      throw new Error("Failed to fetch courses");
    }
    const courses = await response.json();
    return courses;
  } catch (error) {
    console.error("Error fetching courses:", error);
    return [];
  }
}

function renderCourses(courses) {
  const courseList = document.getElementById("course-list");
  courseList.innerHTML = "";

  if (courses.length === 0) {
    courseList.innerHTML = `
      <div class="col-12">
        <div class="alert alert-warning" role="alert">
          No courses found.
        </div>
      </div>`;
    return;
  }

  const startIndex = (currentPage - 1) * coursesPerPage;
  const endIndex = startIndex + coursesPerPage;

  const paginatedCourses = courses.slice(startIndex, endIndex);

  paginatedCourses.forEach((course) => {
    const card = document.createElement("div");
    card.className = "col-md-4";

    const formattedDates = course.start_dates
      .map((date) => {
        const options = {
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        };
        return new Date(date).toLocaleString("en-US", options);
      })
      .join("<br>");

    card.innerHTML = `
      <div class="card">
        <div class="card-body">
          <h5 class="card-title">${course.name}</h5>
          <p class="card-text">${course.description}</p>
          <p class="card-text">Instructor: ${course.teacher}</p>
          <p class="card-text">Level: ${course.level}</p>
          <p class="card-text">Duration: ${course.total_length} weeks</p>
          <p class="card-text"><strong>Start Dates:</strong><br>${formattedDates}</p>
          <button class="btn btn-primary apply-button" data-bs-toggle="modal" data-bs-target="#applyModal" data-id="${course.id}">Apply</button>
        </div>
      </div>`;

    const applyButton = card.querySelector(".apply-button");
    applyButton.addEventListener("click", () => {
      setupApplicationForm(course);
    });

    courseList.appendChild(card);
  });

  renderPagination(courses.length);
}

function setupApplicationForm(course) {
  document.getElementById("applyCourseName").value = course.name;
  document.getElementById("applyCourseName").setAttribute("data-id", course.id); // Устанавливаем ID курса
  document.getElementById("instructorName").value = course.teacher;
  document.getElementById(
    "courseDuration"
  ).value = `${course.total_length} weeks`;

  const startDateSelect = document.getElementById("startDate");
  startDateSelect.innerHTML = "";

  const dates = [
    ...new Set(course.start_dates.map((dateTime) => dateTime.split("T")[0])),
  ];
  dates.forEach((date) => {
    const option = document.createElement("option");
    option.value = date;
    option.textContent = new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    startDateSelect.appendChild(option);
  });

  startDateSelect.addEventListener("change", () => {
    const selectedDate = startDateSelect.value;
    const startTimeSelect = document.getElementById("startTime");
    startTimeSelect.innerHTML = "";

    const times = course.start_dates
      .filter((dateTime) => dateTime.startsWith(selectedDate))
      .map((dateTime) => dateTime.split("T")[1].slice(0, 5));

    times.forEach((time) => {
      const option = document.createElement("option");
      option.value = time;
      option.textContent = time;
      startTimeSelect.appendChild(option);
    });
    if (selectedDate) {
      const startDate = new Date(selectedDate);
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + course.total_length * 7);
      document.getElementById("endDate").value = endDate.toLocaleDateString(
        "en-US",
        {
          year: "numeric",
          month: "long",
          day: "numeric",
        }
      );
    }
  });

  startDateSelect.dispatchEvent(new Event("change"));

  document
    .querySelectorAll("#applyForm input, #applyForm select")
    .forEach((input) => {
      input.addEventListener("change", () => {
        const totalCost = calculateTotalCost(course);
        document.getElementById("totalCost").value = `${totalCost} RUB`;
      });
    });

  const totalCost = calculateTotalCost(course);
  document.getElementById("totalCost").value = `${totalCost} RUB`;
}

function calculateTotalCost(course) {
  const studentsNumber =
    parseInt(document.getElementById("studentsNumber").value) || 1;
  let totalCost =
    course.course_fee_per_hour * course.total_length * course.week_length;
  const discountMessage = document.getElementById("discountMessage");
  discountMessage.innerHTML = "";

  const oneMonthAhead = new Date();
  oneMonthAhead.setMonth(oneMonthAhead.getMonth() + 1);

  if (new Date(course.start_dates[0]) > oneMonthAhead) {
    totalCost *= 0.9;
    discountMessage.innerHTML += "10% Early Registration Discount applied.<br>";
  }

  if (studentsNumber >= 5) {
    totalCost *= 0.85;
    discountMessage.innerHTML += "15% Group Enrollment Discount applied.<br>";
  }

  if (course.week_length > 20) {
    totalCost *= 1.2;
    discountMessage.innerHTML += "20% Intensive Course Fee added.<br>";
  }

  if (document.getElementById("supplementary").checked)
    totalCost += 2000 * studentsNumber;
  if (document.getElementById("personalized").checked)
    totalCost += 1500 * course.total_length;
  if (document.getElementById("excursions").checked) totalCost *= 1.25;
  if (document.getElementById("assessment").checked) totalCost += 300;
  if (document.getElementById("interactive").checked) totalCost *= 1.5;

  return totalCost;
}

async function createOrder(
  courseId,
  startDate,
  startTime,
  students,
  totalCost
) {
  try {
    const checkboxes = document.querySelectorAll("input[type='checkbox']");
    const options = {};

    checkboxes.forEach((checkbox) => {
      options[checkbox.id] = checkbox.checked;
    });

    const requestData = {
      course_id: courseId,
      tutor_id: 0,
      date_start: startDate,
      time_start: startTime,
      duration: parseInt(document.getElementById("courseDuration").value),
      persons: students,
      price: totalCost,
      student_id: 7,
      ...options,
    };

    const response = await fetch(
      `http://cat-facts-api.std-900.ist.mospolytech.ru/api/orders?api_key=1351c78e-5afb-4126-9d17-5925335ee1e6`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestData),
      }
    );

    if (!response.ok) throw new Error("Failed to create order");

    alert("Order created successfully!");
    window.location.href = "account.html";
  } catch (error) {
    console.error("Error creating order:", error);
    alert("Failed to create order.");
  }
}

function renderPagination(totalCourses) {
  const paginationContainer = document.querySelector(".pagination");
  paginationContainer.innerHTML = "";

  const totalPages = Math.ceil(totalCourses / coursesPerPage);

  const prevLi = document.createElement("li");
  prevLi.className = `page-item ${currentPage === 1 ? "disabled" : ""}`;
  prevLi.innerHTML = `<a class="page-link" href="#">Previous</a>`;
  prevLi.addEventListener("click", (e) => {
    e.preventDefault();
    if (currentPage > 1) {
      currentPage--;
      fetchCourses().then(renderCourses);
    }
  });
  paginationContainer.appendChild(prevLi);

  for (let i = 1; i <= totalPages; i++) {
    const pageLi = document.createElement("li");
    pageLi.className = `page-item ${i === currentPage ? "active" : ""}`;
    pageLi.innerHTML = `<a class="page-link" href="#">${i}</a>`;
    pageLi.addEventListener("click", (e) => {
      e.preventDefault();
      currentPage = i;
      fetchCourses().then(renderCourses);
    });
    paginationContainer.appendChild(pageLi);
  }

  const nextLi = document.createElement("li");
  nextLi.className = `page-item ${
    currentPage === totalPages ? "disabled" : ""
  }`;
  nextLi.innerHTML = `<a class="page-link" href="#">Next</a>`;
  nextLi.addEventListener("click", (e) => {
    e.preventDefault();
    if (currentPage < totalPages) {
      currentPage++;
      fetchCourses().then(renderCourses);
    }
  });
  paginationContainer.appendChild(nextLi);
}

document.getElementById("applyForm").addEventListener("submit", (event) => {
  event.preventDefault();

  const courseId = parseInt(
    document.getElementById("applyCourseName").getAttribute("data-id")
  );
  const startDate = document.getElementById("startDate").value;
  const startTime = document.getElementById("startTime").value;
  const students =
    parseInt(document.getElementById("studentsNumber").value) || 1;
  const totalCost = parseFloat(
    document.getElementById("totalCost").value.replace("RUB", "").trim()
  );

  if (!courseId || !startDate || !startTime || isNaN(totalCost)) {
    alert("Please fill out all required fields.");
    return;
  }

  createOrder(courseId, startDate, startTime, students, totalCost);
});

fetchCourses().then(renderCourses);