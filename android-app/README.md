# Android-версия «Тренировки»

Нативная оболочка (Capacitor 8) вокруг того же `index.html`, что и веб-версия. Добавляет:
уведомления о тренировках, конце отдыха и задачах тренера; сканер штрихкодов Google (ML Kit);
кнопку «Назад»; резервную копию через «Поделиться»; проверку обновлений (только для APK).

Собирается в GitHub Actions (`.github/workflows/android.yml`) при каждом изменении приложения;
готовые файлы — в Releases репозитория:
- `Trenirovki-1.0.N.apk` — установка на телефон;
- `Trenirovki-rustore-1.0.N.apk` / `.aab` — загрузка в RuStore.

Подпись — секреты `ANDROID_KEYSTORE_B64` и `ANDROID_KEYSTORE_PASSWORD` (Settings → Secrets and variables → Actions).
Ключ хранится у владельца; без него обновления не встанут поверх установленной версии.
Имя пакета: `ru.suxooi.trenirovki`. Минимальная версия Android — 7.0 (API 24).
