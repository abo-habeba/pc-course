// المتغيرات الأساسية لتخزين حجم الخط الحالي
let currentFontSize = 16;
const FONT_SIZE_STEP = 2; // خطوة التغيير

// (جديد) متغير فلاج لمنع توليد محتوى الطباعة الكاملة أكثر من مرة
let isFullCourseGenerated = false;

// ----------------------------------------------------
// 1. دوال بناء القالب (Templating Functions)
// ----------------------------------------------------

/**
 * يبني الـ HTML الخاص بصندوق معلومات (Box) بناءً على نوعه ومحتواه
 * @param {string} style - (info, success, alert, warning, neutral, special, etc.)
 * @param {string} title - عنوان الصندوق
 * @param {string} text - (اختياري) نص بسيط داخل الصندوق
 * @param {string} intro - (اختياري) مقدمة قبل القائمة
 * @param {Array<string>} items - (اختياري) قائمة نقاط
 * @param {string} listType - ('list-disc' للقائمة النقطية, 'list-decimal' للقائمة الرقمية)
 * @returns {string} - كود HTML جاهز
 */
function buildBoxHtml(
  style,
  title,
  text,
  intro,
  items,
  listType = "list-disc"
) {
  // تحديد الألوان بناءً على الـ style
  const styleMap = {
    info: "bg-blue-100 border-secondary text-primary",
    success: "bg-green-100 border-green-500 text-green-700",
    alert: "bg-red-100 border-red-500 text-red-700",
    warning: "bg-yellow-100 border-yellow-500 text-yellow-800",
    neutral: "bg-gray-100 border-gray-500 text-gray-800",
    special: "bg-purple-100 border-purple-500 text-purple-800",
    accent: "bg-teal-100 border-teal-500 text-teal-800",
    special_2: "bg-orange-100 border-orange-500 text-orange-800",
    special_3: "bg-indigo-100 border-indigo-500 text-indigo-800",
  };
  const boxClasses = styleMap[style] || styleMap["neutral"];

  let contentHtml = "";

  if (intro) {
    contentHtml += `<p>${intro}</p>`;
  }

  if (items && items.length > 0) {
    contentHtml += `<ul class="${listType} list-inside space-y-2 mt-3 pr-4">`;
    contentHtml += items.map((item) => `<li>${item}</li>`).join("");
    contentHtml += `</ul>`;
  }

  if (text) {
    contentHtml += `<p>${text}</p>`;
  }

  // بناء الصندوق الكامل
  return `
        <div class="p-4 rounded-xl border-r-4 my-6 ${boxClasses}">
            <h4 class="font-bold text-xl mb-2">${title}</h4>
            ${contentHtml}
        </div>
    `;
}

/**
 * يبني الـ HTML الخاص بالمحتوى الرئيسي للدرس
 * @param {Array<Object>} contentArray - مصفوفة المحتوى من ملف content.js
 * @returns {string} - كود HTML جاهز للمحتوى
 */
function buildLessonContentHtml(contentArray) {
  let html = "";
  if (!contentArray) return html;

  for (const item of contentArray) {
    switch (item.type) {
      case "h3":
        html += `<h3 class="text-xl font-bold text-secondary mt-8 mb-4">${item.text}</h3>`;
        break;
      case "p":
        html += `<p class="mb-6">${item.text}</p>`;
        break;
      case "box_simple":
        html += buildBoxHtml(item.style, item.title, item.text, null, null);
        break;
      case "box_list":
        html += buildBoxHtml(
          item.style,
          item.title,
          null,
          item.intro,
          item.items,
          "list-disc"
        );
        break;
      case "steps":
        html += buildBoxHtml(
          item.style,
          item.title,
          null,
          item.intro,
          item.items,
          "list-decimal"
        );
        break;
      case "box_alert":
        html += buildBoxHtml("alert", item.title, item.text, null, null);
        break;
      case "list_simple":
        html += `<ul class="list-disc list-inside space-y-2 mt-3 mb-6 pr-4">`;
        html += item.items.map((li) => `<li>${li}</li>`).join("");
        html += `</ul>`;
        break;
      default:
        console.warn("نوع محتوى غير معروف:", item.type);
    }
  }
  return html;
}

// ----------------------------------------------------
// 2. الدوال الرئيسية لعمل الموقع
// ----------------------------------------------------

/**
 * دالة تحميل محتوى الدرس في المنطقة الرئيسية
 * @param {string} lessonId - مُعرف الدرس (مثل 'lesson-1')
 */
function loadLesson(lessonId) {
  if (typeof lessons === "undefined" || !lessons[lessonId]) {
    console.error("خطأ: لم يتم العثور على الدروس أو ملف content.js.");
    return;
  }

  const lesson = lessons[lessonId];
  const container = document.getElementById("lesson-container");
  const lessonContentDiv = document.createElement("div");

  lessonContentDiv.className =
    "lesson-content opacity-0 transform translate-y-5 lesson-card bg-card p-6 md:p-8 rounded-xl shadow-lg";
  lessonContentDiv.style.opacity = "0";
  lessonContentDiv.style.transform = "translateY(20px)";

  // بناء محتوى الأسئلة
  const quizHtml = lesson.quiz
    .map((q, index) => {
      const answerId = `answer-${lessonId}-${index}`;
      return `
            <div class="quiz-item mb-4 p-3 bg-yellow-100 rounded-md shadow-inner">
                <p class="font-medium text-gray-800">${q.q}</p>
                <button 
                    onclick="toggleAnswer('${answerId}', this)" 
                    class="quiz-toggle-btn text-sm text-primary font-bold py-1 px-3 mt-2 rounded-md bg-white hover:bg-gray-100 border border-secondary/50 transition"
                >
                    عرض الإجابة
                </button>
                <p 
                    id="${answerId}" 
                    class="quiz-answer hidden pt-2 border-t border-yellow-300 mt-2 text-sm text-gray-700"
                >
                    ${q.a}
                </p>
            </div>
        `;
    })
    .join("");

  // بناء المحتوى الرئيسي
  const mainContentHtml = buildLessonContentHtml(lesson.content);

  // إنشاء هيكل الدرس
  lessonContentDiv.innerHTML = `
        <div class="content-text" style="font-size: ${currentFontSize}px;">
            <h2 class="text-3xl font-extrabold text-primary mb-6 border-b-4 pb-2 border-secondary/50">${lesson.title}</h2>
            
            <!-- هدف الدرس -->
            <div class="bg-green-50 p-4 rounded-lg border-r-4 border-green-600 mb-6 shadow-sm">
                <p class="font-extrabold text-green-700 flex items-center mb-1">
                    <svg class="w-5 h-5 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 10h4.765a2 2 0 011.789 2.89l-3.5 7A2 2 0 0115.265 21H6.55a2 2 0 01-1.883-1.883l.35-3.513A1.5 1.5 0 005.152 14H12m2-4v9.067l.35.351A1.5 1.5 0 0015.152 21H17M14 10V5a2 2 0 00-2-2h-2a2 2 0 00-2 2v2m0 0v2m0 0v2"></path></svg>
                    🎯 الهدف من الدرس:
                </p>
                <p class="text-gray-700">${lesson.goal}</p>
            </div>

            <!-- صورة توضيحية (Placeholder) -->
            <figure class="my-6 rounded-lg overflow-hidden shadow-md border border-gray-100">
                <img src="${lesson.imagePlaceholder}" alt="${lesson.title}" class="w-full h-auto object-cover">
                <figcaption class="p-2 text-center text-sm text-gray-500 bg-gray-50 border-t">صورة توضيحية: ${lesson.title}</figcaption>
            </figure>

            <!-- محتوى الدرس -->
            ${mainContentHtml}

            <!-- ملخص الدرس وأسئلة التقييم -->
            <h3 class="text-2xl font-bold text-secondary mt-10 mb-4 border-t pt-4">📚 ملخص وأسئلة تقييم ذاتي</h3>
            <div class="bg-yellow-50 p-4 rounded-xl border-l-4 border-yellow-500 mb-6 shadow-sm">
                <p class="font-extrabold text-yellow-700 mb-3">راجع نفسك!</p>
                ${quizHtml}
            </div>
        </div>
    `;

  container.innerHTML = "";
  container.appendChild(lessonContentDiv);

  setTimeout(() => {
    lessonContentDiv.style.opacity = "1";
    lessonContentDiv.style.transform = "translateY(0)";
  }, 10);

  // تحديث الفئة النشطة في القائمة
  document.querySelectorAll("#lesson-list a").forEach((a) => {
    a.classList.remove("bg-accent/50", "text-primary", "font-extrabold");
    a.classList.add("hover:bg-gray-100", "text-gray-700");
  });
  const activeLink = document.querySelector(`a[data-lesson-id="${lessonId}"]`);
  if (activeLink) {
    activeLink.classList.add("bg-accent/50", "text-primary", "font-extrabold");
    activeLink.classList.remove("hover:bg-gray-100", "text-gray-700");
  }

  if (window.innerWidth < 768) {
    toggleSidebar(false);
  }

  document.getElementById("content-area").scrollTo(0, 0);
}

/**
 * دالة تغيير حجم الخط
 * @param {number} delta - (2 أو -2)
 */
function changeFontSize(delta) {
  currentFontSize += delta;
  if (currentFontSize < 14) currentFontSize = 14;
  if (currentFontSize > 24) currentFontSize = 24;

  document.querySelectorAll(".content-text").forEach((element) => {
    element.style.fontSize = `${currentFontSize}px`;
  });
}

/**
 * دالة إظهار/إخفاء الإجابة وتغيير نص الزر
 * @param {string} answerId - مُعرف الإجابة
 * @param {HTMLElement} buttonElement - الزر الذي تم الضغط عليه
 */
function toggleAnswer(answerId, buttonElement) {
  const answerElement = document.getElementById(answerId);
  if (!answerElement) return;

  if (answerElement.classList.contains("hidden")) {
    answerElement.classList.remove("hidden");
    buttonElement.textContent = "إخفاء الإجابة";
  } else {
    answerElement.classList.add("hidden");
    buttonElement.textContent = "عرض الإجابة";
  }
}

/**
 * دالة تبديل إظهار/إخفاء القائمة الجانبية في وضع الموبايل
 * @param {boolean | null} shouldToggle - (true للإظهار, false للإخفاء, null للتبديل)
 */
function toggleSidebar(shouldToggle = null) {
  const sidebar = document.getElementById("sidebar");
  const overlay = document.getElementById("sidebar-overlay");
  if (!sidebar || !overlay) return;

  const isShown = sidebar.classList.contains("translatex-0");
  let show = shouldToggle !== null ? shouldToggle : !isShown;

  if (show) {
    sidebar.classList.remove("-translate-x-full", "show-sidebar");
    sidebar.classList.add("translate-x-0");
    overlay.classList.remove("hidden", "opacity-0");
    overlay.classList.add("opacity-50");
    document.body.style.overflow = "hidden";
  } else {
    sidebar.classList.remove("translate-x-0");
    sidebar.classList.add("-translate-x-full", "show-sidebar");
    overlay.classList.remove("opacity-50");
    overlay.classList.add("opacity-0");
    document.body.style.overflow = "auto";
    setTimeout(() => {
      overlay.classList.add("hidden");
    }, 300);
  }
}

/**
 * دالة الطباعة (للطباعة الدرس الحالي)
 * (جديد) تضيف 'printing-lesson' إلى الـ body
 */
function printContent() {
  document.body.classList.add("printing-lesson");
  window.print();
  // استخدام 'afterprint' لضمان إزالة الفئة حتى لو أغلق المستخدم نافذة الطباعة
  window.onafterprint = () => {
    document.body.classList.remove("printing-lesson");
    window.onafterprint = null; // إزالة الحدث بعد تنفيذه
  };
  // كحل احتياطي إذا لم يتم دعم 'onafterprint' (نادر)
  setTimeout(() => {
    document.body.classList.remove("printing-lesson");
  }, 1000);
}

/**
 * (جديد) دالة طباعة الكورس بالكامل
 * (جديد) تضيف 'printing-course' إلى الـ body
 */
function printFullCourse() {
  const printContainer = document.getElementById("print-all-container");
  if (!printContainer) {
    console.error("لم يتم العثور على حاوية الطباعة #print-all-container");
    return;
  }

  // (مهم) توليد المحتوى مرة واحدة فقط لتوفير الموارد
  if (!isFullCourseGenerated) {
    console.log("جاري توليد محتوى الكورس الكامل للطباعة...");
    let fullCourseHtml = "";

    if (typeof lessons === "undefined") {
      console.error("خطأ: لم يتم العثور على الدروس أو ملف content.js.");
      return;
    }

    // المرور على كل الدروس في content.js
    for (const lessonId in lessons) {
      const lesson = lessons[lessonId];
      if (!lesson) continue;

      // بناء محتوى الأسئلة للطباعة (إظهار السؤال والإجابة مباشرة)
      const quizHtml = lesson.quiz
        .map((q) => {
          return `
                    <div class="quiz-item mb-4 p-3 bg-yellow-100 rounded-md">
                        <p class="font-medium text-gray-800">${q.q}</p>
                        <!-- (معدل للطباعة) إظهار الإجابة مباشرة -->
                        <p class="quiz-answer-print pt-2 border-t border-yellow-300 mt-2 text-sm text-gray-700">
                            <strong>الإجابة:</strong> ${q.a}
                        </p>
                    </div>
                `;
        })
        .join("");

      // بناء المحتوى الرئيسي للدرس
      const mainContentHtml = buildLessonContentHtml(lesson.content);

      // إضافة الدرس بالكامل إلى الحاوية
      // (استخدام كلاس .lesson-print-wrapper لفاصل الصفحات)
      fullCourseHtml += `
                  <div class="lesson-print-wrapper">
                    <div class="content-text" style="font-size: 16px;"> 
                      <h2 class="text-3xl font-extrabold text-primary mb-6 border-b-4 pb-2 border-secondary/50">${lesson.title}</h2>
                      
                      <div class="bg-green-50 p-4 rounded-lg border-r-4 border-green-600 mb-6">
                        <p class="font-extrabold text-green-700">🎯 الهدف من الدرس:</p>
                        <p class="text-gray-700">${lesson.goal}</p>
                      </div>
                      
                      <figure class="my-6 rounded-lg overflow-hidden border">
                        <img src="${lesson.imagePlaceholder}" alt="${lesson.title}" class="w-full h-auto object-cover">
                      </figure>
                      
                      ${mainContentHtml}

                      <h3 class="text-2xl font-bold text-secondary mt-10 mb-4 border-t pt-4">📚 ملخص وأسئلة تقييم ذاتي</h3>
                      <div class="bg-yellow-50 p-4 rounded-xl border-l-4 border-yellow-500 mb-6">
                        ${quizHtml}
                      </div>
                      <div>
                          <div style="all: unset; display: block; margin-top: 1.5rem; !important; padding-left: 30px; text-align: left; font-size: 14px;">
                            انتهى الدرس
                          </div>
                          <div style="all: unset; display: block; margin-top: 1.5rem; !important; padding: 0.75rem; color: #2563eb; text-align: left; font-size: 14px;">
                            تحياتي هشام محمد
                          </div>
                      </div>
                    </div>
                  </div>
                `;
    } // نهاية اللوب

    printContainer.innerHTML = fullCourseHtml;
    isFullCourseGenerated = true; // تعيين الفلاج
    console.log("تم توليد المحتوى. جاهز للطباعة الكاملة.");
  }

  // (جديد) إضافة الفئة المؤقتة
  document.body.classList.add("printing-course");
  console.log("استدعاء نافذة الطباعة...");
  window.print();

  // (جديد) إزالة الفئة بعد الطباعة
  window.onafterprint = () => {
    document.body.classList.remove("printing-course");
    window.onafterprint = null;
  };
  setTimeout(() => {
    document.body.classList.remove("printing-course");
  }, 1000);
}

// ----------------------------------------------------
// 3. تهيئة الموقع عند التحميل
// ----------------------------------------------------
window.onload = function () {
  const lessonList = document.getElementById("lesson-list");

  if (typeof lessons === "undefined") {
    console.error("خطأ فادح: ملف content.js غير موجود أو لم يتم تحميله.");
    return;
  }

  // 1. بناء قائمة الدروس في الشريط الجانبي
  Object.keys(lessons).forEach((id) => {
    const li = document.createElement("li");
    li.className = "mb-2";
    const a = document.createElement("a");
    a.href = "#";
    a.textContent = lessons[id].title;
    a.dataset.lessonId = id;
    a.className =
      "block p-3 rounded-lg text-gray-700 hover:bg-gray-100 transition duration-150 ease-in-out font-medium";
    a.onclick = (e) => {
      e.preventDefault();
      loadLesson(id);
    };
    li.appendChild(a);
    lessonList.appendChild(li);
  });

  // 2. تحميل الدرس الأول تلقائيًا
  loadLesson("lesson-1");
};
