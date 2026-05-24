/**
 * Agrosence Theme Manager
 * المسؤول عن توحيد الوضع المظلم والفاتح في كل صفحات الموقع
 */

(function() {
    // 1. التحقق من التفضيل المحفوظ
    const savedTheme = localStorage.getItem('theme') || 'light';
    const body = document.body;
    const path = window.location.pathname;

    // 2. تطبيق الوضع المظلم إذا كان مختاراً
    if (savedTheme === 'dark') {
        body.classList.add('dark-mode');
        // إذا كنا في صفحة الخلفية الفاتحة، نحول المستخدم للمظلمة
        if (path.endsWith('back.html')) {
            window.location.href = 'backdark.html';
        }
    } else {
        body.classList.remove('dark-mode');
        // إذا كنا في صفحة الخلفية المظلمة، نحول المستخدم للفاتحة
        if (path.endsWith('backdark.html')) {
            window.location.href = 'back.html';
        }
    }
})();

// وظيفة تبديل الوضع (تستدعى عند الضغط على الزر)
function toggleAgrosenceTheme() {
    const currentTheme = localStorage.getItem('theme') || 'light';
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    
    localStorage.setItem('theme', newTheme);
    
    // التوجيه الذكي
    const path = window.location.pathname;
    if (path.endsWith('back.html') || path.endsWith('backdark.html')) {
        window.location.href = (newTheme === 'dark') ? 'backdark.html' : 'back.html';
    } else {
        // في الصفحات العادية، نقوم فقط بتبديل الكلاس وتحديث الصفحة
        document.body.classList.toggle('dark-mode');
        location.reload(); 
    }
}
