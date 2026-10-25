"""Правки сгенерированного android/: разрешения, ML Kit, значок уведомлений, номер версии, только портрет."""
import sys,re,os,shutil
build=int(sys.argv[1])
man='android/app/src/main/AndroidManifest.xml'
m=open(man,encoding='utf-8').read()
perms=['android.permission.CAMERA','android.permission.POST_NOTIFICATIONS','android.permission.SCHEDULE_EXACT_ALARM','android.permission.VIBRATE','android.permission.RECEIVE_BOOT_COMPLETED']
add=''.join('    <uses-permission android:name="%s" />\n'%p for p in perms if p not in m)
m=m.replace('<application',add+'\n    <application',1) if add else m
if 'com.google.mlkit.vision.DEPENDENCIES' not in m:
    m=re.sub(r'(<application[^>]*>)',r'\1\n        <meta-data android:name="com.google.mlkit.vision.DEPENDENCIES" android:value="barcode_ui" />',m,count=1)
if 'screenOrientation' not in m:
    m=re.sub(r'(<activity\b)',r'\1 android:screenOrientation="portrait"',m,count=1)
open(man,'w',encoding='utf-8').write(m)
os.makedirs('android/app/src/main/res/drawable',exist_ok=True)
shutil.copy('res/drawable/ic_stat_notify.xml','android/app/src/main/res/drawable/ic_stat_notify.xml')
# файлы для assets (например, фрагмент подтверждения владельца для Android Developer Console)
if os.path.isdir('native-assets'):
    dst='android/app/src/main/assets';os.makedirs(dst,exist_ok=True)
    for f in os.listdir('native-assets'):
        if f!='README.md':shutil.copy(os.path.join('native-assets',f),os.path.join(dst,f))
g='android/app/build.gradle'
s=open(g,encoding='utf-8').read()
s=re.sub(r'versionCode\s+\d+','versionCode %d'%build,s,count=1)
s=re.sub(r'versionName\s+"[^"]*"','versionName "1.0.%d"'%build,s,count=1)
open(g,'w',encoding='utf-8').write(s)
print('patched: versionCode',build)
