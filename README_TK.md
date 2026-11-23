# AB_shoping — taýýar dropshipping saýty

Üç dilli (Türkmen / Русский / English), mobil enjamlara uýgun, haryt katalogy, gözleg, kategoriýalar, sebet, sargyt formasy, sosial tor baglanyşyklary we aýratyn admin paneli bolan işläp bilýän **Node.js + SQLite** web saýty. NPM paketlerini gurnamak gerek däl.

## Başlatmak (Windows / macOS / Linux)

1. **Node.js 22.13+** ýa-da 24+ gurnaň.
2. `.env.example` faýlynyň nusgasyny `.env` edip atlandyryň.
3. `.env` içindäki `ADMIN_EMAIL` we `ADMIN_PASSWORD` bahalaryny öz maglumatyňyz bilen çalşyryň. Admin parolyňyz azyndan 12 simwol bolmaly.
4. Terminalda proýektiň bukjasynda `npm start` ýazyň.
5. Dükany açyň: **http://localhost:3000**
6. Admin paneli açyň: **http://localhost:3000/admin**

Öz `.env` faýlyňyzy hiç kime ibermäň, internetde çap etmäň.

## Sosial torlar — 23.11.2026 täzelenmesi

Dükanyň **Habarlaşmak** bölümindäki düwmeler aşakdaky salgylar bilen baglanyşdyryldy:

- Instagram: `@dr.bayramov_ahmet` — https://www.instagram.com/dr.bayramov_ahmet/
- Telegram: `@dr_bayramow` — https://t.me/dr_bayramow
- WhatsApp: `+99365132834` — https://wa.me/99365132834

Bu baglanyşyklar täze gurnamada deslapky sazlama hökmünde gelýär. Öňden döredilen `data/store.sqlite` maglumat bazasy bilen işleýän saýtda hem **täzelenen `server.js` faýly bilen serweri täzeden açanyňyzda** bir gezek awtomatik goşulýar. Soňundan admin panelinde edilen üýtgeşmeler täzeden başlamada ýazylmaz. Saýt internetde ýerleşdirilen bolsa, bu ZIP faýlyny ol ýere aýratyn ýerleşdirmek gerek; diňe bu faýly göçürip almak bilen janly saýt üýtgemeýär.

WhatsApp telefon belgiňiziň müşderilere görünjekdigine üns beriň: `wa.me` salgysy arkaly ony görüp bilerler.

## Admin panelinde näme bar?

- Sargytlaryň sanawy, müşderi maglumatlary, zakaz önümleri, senesi, jemi.
- Ýagdaýlar: Täze → Tassyklanan → Taýýarlanýar → Ýolda → Eltildi; ýa-da Ýatyryldy.
- Haryt goşmak, üýtgetmek, pozmak: TM, RU, EN atlary we düşündirişleri, baha, kategoriýa, surat URL-sy.
- Instagram, Telegram, WhatsApp akkauntlaryny goşmak (hasap ady ýa-da HTTPS salgysy, WhatsApp üçin telefon).
- USD, CNY, TMT, EUR pul birlikleri. **Pul birligi üýtgese, öňki bahalar awtomatik konwertasiýa edilmeýär!**
- Synag tertibini açmak/öçürmek.

## Işe goýbermegiň öňüsyrasyndaky zerur ädimler

1. Admin panelindäki **mysal üçin döredilen harytlary** öz hakyky önümleriňiz bilen çalşyryň. Başlangyç katalog diňe görkezme maksatlaýyn taýýarlanyldy.
2. Harytlaryň hakyky bahalaryny we suratlaryny giriziň.
3. **Sazlamalar** bölüminde Instagram, Telegram, WhatsApp baglanyşyklary öňünden girizilen. Isleseňiz, admin panelinden üýtgedip bilersiňiz.
4. Diňe hakyky önümler, bahalar we eltme prosesleri taýýar bolanda **Synag tertibini** öçüriň.
5. Domen, HTTPS we serwer üpjün edijisini sazlaň. Mysal üçin Node.js goldaýan hosting gerek. `DATA_DIR` üçin **hemişelik disk/volume** ulanyň. Serweriň wagtlaýyn diskinde goýsaňyz, sargytlar ýitip biler.
6. Maglumat bazasynyň (`DATA_DIR/store.sqlite`) ätiýaçlyk nusgalaryny alyň. SQLite WAL faýllaryny hem ünsüňizde saklaň.
7. Hakyky söwda üçin gizlinlik syýasaty, yzyna gaýtarmak, eltip bermek, sargyt we salgy maglumatlarynyň goragy ýaly düzgünleri ýerleşdiriň.

### Dürli hostinglerde

Bu Node.js proýektidir (diňe statik HTML hostinginde sargytlar/admin işlemez). Hosting sazlamalary:

- **Start command:** `npm start`
- **Port:** `PORT` gurşaw üýtgeýjisi (serwer awtomatik okaýar)
- **Env:** `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `NODE_ENV=production`, `DATA_DIR=/persistent-path`
- **HTTPS:** hökmany, esasanam müşderi maglumatlary we admin girişi üçin.
- Häzirki çözgüt bir serwer instansy üçin niýetlenendir. Uly göwrümde başga DB / session storage zerur bolup biler.

## Töleg we sargyt

Saýt **onlaýn töleg almaýar**. Müşderiniň sargydy admin maglumat bazasyna ýazylýar we siz onuň bilen habarlaşyp, baha/eltme/töleg şertlerini tassyklap bilersiňiz. Töleg geçelgesi, e-poçta/Telegram bildirişleri, üpjün edijiler bilen awtomatik dropshipping integrasiýasy goşulmady.

## Howpsuzlyk

Admin paroly serweriň `.env` üýtgeýjisinde saklanýar. Admin girişi HttpOnly/SameSite sessiýa cookie arkaly goragly, login synanyşyklary çäklendirilýär, serwer önümleriň bahasyny gaýtadan hasaplaýar. Admin we sargyt maglumatlary SQLite-da saklanýar. Prodakşn üçin HTTPS, güýçli parol, hemişelik disk we ätiýaçlyk nusgalar hökmandyr.

## Faýllar

- `server.js` — Node.js HTTP API + SQLite
- `public/index.html` — müşderi sahypasy
- `public/shop.js` — üç dilli dükanyň logikasy
- `public/admin.html`, `public/admin.js` — admin panel
- `public/styles.css` — iki sahypanyň dizaýny
- `.env.example` — admin giriş sazlamasynyň nusgasy

## Gurluşsyz açylýan synag görnüşi (goşa basyp açyň)

`AB_shoping_OPEN_ME.html` faýlyna iki gezek basyň, brauzer arkaly synag dükany açylar. Bu synag sahypasynda haryt katalogy, üç dil, sebet, synag sargytlary we aýratyn demo admin bölümi bar. Demo admin bölümi diňe şol faýly açan brauzeriň ýerli maglumatlaryny görkezýär. **Hakyky müşderi sargytlary üçin bu faýly goýbermäň** — `npm start` bilen işleýän Node.js+SQLite serwerli wersiýany HTTPS hostinginde ýerleşdiriň. Hakyky admin girişi `.env` paroly bilen goralýar.


## 23.11.2026 — ölçeg saýlamagy we tekst düzedişi

- Moda kategoriýasyndaky **ölçegi bar** harytlarda müşderi ilki ölçeg saýlamaly. Ölçegi saýlamazdan sebede goşmak mümkin däl.
- Ölçeg her sebet setirinde aýratyn görkezilýär; dürli ölçegler şol bir harytdan aýratyn setirler bolýar. Sargyt bilen maglumata, admin paneline hem geçirilýär.
- Admin panelinde haryt goşanyňyzda ýa-da üýtgedeniňizde `Ölçegler / Размеры / Sizes` içine `S,M,L,XL,XXL` ýa-da aýakgap üçin `36,37,38,39,40` ýaly sanaw ýazyň. Ölçeg gerek däl sumka/elektronika ýaly harytlarda boş goýuň.
- Synag katalogyna ölçegli futbolka goşuldy, krossowka üçin aýakgap ölçegleri elýeterli. Köne maglumat bazasynyň gurluşy serwer başlanda saklanyp giňeldilýär.
- Türkmençe habarlaşmak sözbaşy `Habarlaşmak üçin` diýip üýtgedildi.
- **Taobao/1688 haryt importy häzir integrirlenen däl.** Resmi API giriş/ygtyýar ýa-da harytlary ulanmaga rugsat berlen CSV arkaly import soň goşulyp biler. Razylyk bolmazdan awtomatik maglumat gazyp almakdan gaça duruň.
- `AB_shoping_OPEN_ME.html` diňe lokal synag; adminindäki maglumatlar şol brauzerde saklanýar. Hakyky sargyt üçin serwer, domen we HTTPS zerurdyr.


## Täze düzediş (v1.2)
- Admin panelindäki haryt goşmak/üýtgetmek formasyna **surat faýlyny göni ýüklemek** mümkinçiligi goşuldy.
- Surat saýlananda öňünden görmek (preview) görünýär.
- Uly surat faýllary üçin kiçi ölçegli şekilleri ulanmak maslahat berilýär.
