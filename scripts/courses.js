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
          <button class="btn btn-primary apply-button" data-bs-toggle="modal" data-bs-target="#applyModal">Apply</button>
        </div>
      </div>`;

    const applyButton = card.querySelector(".apply-button");
    applyButton.addEventListener("click", () => {
      document.getElementById("applyCourseName").value = course.name;
      document.getElementById("instructorName").value = course.teacher;

      document
        .getElementById("applyModal")
        .addEventListener("hidden.bs.modal", () => {
          const form = document.getElementById("applyForm");
          form.reset();

          document.getElementById("courseDuration").value = "";
          document.getElementById("endDate").value = "";
          document.getElementById("totalCost").value = "";
        });

      document.getElementById(
        "courseDuration"
      ).value = `${course.total_length} weeks`;

      const startDateSelect = document.getElementById("startDate");
      startDateSelect.innerHTML = "";

      const dates = [
        ...new Set(
          course.start_dates.map((dateTime) => dateTime.split("T")[0])
        ),
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

      const selectedStartDate = new Date(course.start_dates[0]);
      const courseEndDate = new Date(selectedStartDate);
      courseEndDate.setDate(courseEndDate.getDate() + course.total_length * 7);
      document.getElementById("endDate").value =
        courseEndDate.toLocaleDateString();

      const startTimeSelect = document.getElementById("startTime");
      startTimeSelect.innerHTML = "";

      startDateSelect.addEventListener("change", () => {
        const selectedDate = startDateSelect.value;
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
      });

      startDateSelect.dispatchEvent(new Event("change"));

      document
        .querySelectorAll(
          "#studentsNumber, #earlyRegistration, #groupEnrollment, #intensiveCourse, #supplementary, #personalized, #excursions, #assessment, #interactive, #startDate, #startTime"
        )
        .forEach((input) => {
          input.addEventListener("change", () => {
            const totalCost = calculateTotalCost(course);
            document.getElementById("totalCost").value = `${totalCost} RUB`;
          });
        });

      const totalCost = calculateTotalCost(course);
      document.getElementById("totalCost").value = `${totalCost} RUB`;
    });

    courseList.appendChild(card);
  });

  renderPagination(courses.length);
}

function calculateTotalCost(course) {
  const studentsNumber =
    parseInt(document.getElementById("studentsNumber").value) || 1;
  let totalCost =
    course.course_fee_per_hour * course.total_length * course.week_length;

  if (document.getElementById("earlyRegistration").checked) totalCost *= 0.9;
  if (document.getElementById("groupEnrollment").checked && studentsNumber >= 5)
    totalCost *= 0.85;

  if (document.getElementById("intensiveCourse").checked) totalCost *= 1.2;
  if (document.getElementById("supplementary").checked)
    totalCost += 2000 * studentsNumber;
  if (document.getElementById("personalized").checked)
    totalCost += 1500 * course.total_length;
  if (document.getElementById("excursions").checked) totalCost *= 1.25;
  if (document.getElementById("assessment").checked) totalCost += 300;
  if (document.getElementById("interactive").checked) totalCost *= 1.5;

  const selectedDate = new Date(document.getElementById("startDate").value);
  const isWeekendOrHoliday = [0, 6].includes(selectedDate.getDay());
  if (isWeekendOrHoliday) totalCost *= 1.5;

  const startTime = document.getElementById("startTime").value;
  if (startTime >= "09:00" && startTime <= "12:00") totalCost += 400;
  if (startTime >= "18:00" && startTime <= "20:00") totalCost += 1000;

  return totalCost * studentsNumber;
}

async function createOrder(date, students, totalCost) {
  try {
    const checkboxes = document.querySelectorAll("input[type='checkbox']");
    const options = {};

    checkboxes.forEach((checkbox) => {
      options[checkbox.id] = checkbox.checked;
    });

    const response = await fetch(
      `http://cat-facts-api.std-900.ist.mospolytech.ru/api/orders?api_key=1351c78e-5afb-4126-9d17-5925335ee1e6`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          course_id: course.id,
          date_start: date,
          students: students,
          price: totalCost,
          ...options,
          tutor_id: 1,
          time_start: "10:00:00",
          student_id: 7,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }),
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

fetchCourses().then(renderCourses);