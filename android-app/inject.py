"""Готовит www/index.html для Android: подключает capacitor.js, канал сборки (apk / rustore) и номер сборки."""
import sys,os
path,channel,build=sys.argv[1],sys.argv[2],sys.argv[3]
h=open(path,encoding='utf-8').read()
tag='<script>window.APP_CHANNEL=%r;window.APP_BUILD=%d;</script>'%(channel,int(build))
cap='<script src="capacitor.js"></script>' if os.path.exists(os.path.join(os.path.dirname(path),'capacitor.js')) else ''
if 'window.APP_CHANNEL=' in h:
    import re;h=re.sub(r"<script>window\.APP_CHANNEL=.*?</script>",tag,h,count=1)
else:
    h=h.replace('<head>','<head>\n'+cap+tag,1)
open(path,'w',encoding='utf-8').write(h)
print('www/index.html:',channel,build,'capacitor.js' if cap else 'без capacitor.js')
