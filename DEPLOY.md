# MEDLIVER HIS — Deployment Guide

> **Орчин:** Ubuntu 22.04 LTS · Docker · Nginx · MongoDB 7 · Let's Encrypt SSL  
> **Домэйн:** `app.medliver.mn`  
> **Зориулалт:** 2000+ өвчтөн, 50 зэрэгцэх хэрэглэгч

---

## Агуулга

1. [Серверийн шаардлага](#1-серверийн-шаардлага)
2. [Contabo VPS худалдан авах](#2-contabo-vps-худалдан-авах)
3. [Монгол домэйн бүртгэл (.mn)](#3-монгол-домэйн-бүртгэл-mn)
4. [DNS тохиргоо (Cloudflare)](#4-dns-тохиргоо-cloudflare)
5. [Серверийн анхны тохиргоо](#5-серверийн-анхны-тохиргоо)
6. [Docker суулгах](#6-docker-суулгах)
7. [MongoDB суулгах ба тохиргоо](#7-mongodb-суулгах-ба-тохиргоо)
8. [Код серверт оруулах](#8-код-серверт-оруулах)
9. [SSL сертификат авах](#9-ssl-сертификат-авах)
10. [Системийг ажиллуулах](#10-системийг-ажиллуулах)
11. [Анхны өгөгдөл (Seed)](#11-анхны-өгөгдөл-seed)
12. [Галт хана (Firewall)](#12-галт-хана-firewall)
13. [Өдөр тутмын Backup](#13-өдөр-тутмын-backup)
14. [Шинэчлэх (Update)](#14-шинэчлэх-update)
15. [Алдааг засах (Troubleshooting)](#15-алдааг-засах-troubleshooting)

---

## 1. Серверийн шаардлага

| | Хамгийн бага | ✅ Санал болгох |
|---|---|---|
| **CPU** | 4 vCPU | **8 vCPU** |
| **RAM** | 8 GB | **16 GB** |
| **SSD** | 100 GB | **400 GB** |
| **Сүлжээ** | 100 Mbps | **1 Gbps** |
| **OS** | Ubuntu 22.04 | **Ubuntu 22.04 LTS** |
| **Зэрэгцэх хэрэглэгч** | ~15 | **~50** |

### Deployment архитектур

```
Интернет (80/443)
  → Nginx (Docker) — SSL terminate, reverse proxy
      → /api/*  → NestJS API   (his-api:4000)
      → /*      → Next.js Web  (his-web:3000)
  → MongoDB     (his-mongo:27017 — дотоод сүлжээ)
```

---

## 2. Contabo VPS худалдан авах

**Зөвлөмж:** Contabo VPS M — **$14.99/сар** (8vCPU · 16GB · 400GB SSD)

1. **contabo.com** руу орно
2. **Cloud VPS** → **VPS M** сонгоно
3. **Region:** `Japan (Tokyo)` эсвэл `Singapore` сонгоно *(Монголоос хамгийн ойр)*
4. **OS Image:** `Ubuntu 22.04` сонгоно
5. **Root password** аюулгүй нууц үг тавина
6. Захиалга хийхэд 15-30 минутын дотор IP хаяг ирнэ

> 💡 Contabo snapshot backup ($1.99/сар) нэмэх — заавал авахыг зөвлөж байна

---

## 3. Монгол домэйн бүртгэл (.mn)

**Бүртгэгч сонголт:**

| Бүртгэгч | Вэбсайт | Үнэ | Анхаарах |
|---|---|---|---|
| MMDN Registry | registry.mn | ~$25/жил | Албан ёсны .mn бүртгэгч |
| Netmagic | netmagic.mn | ~$20/жил | Монгол дэмжлэгтэй |
| Domain.mn | domain.mn | ~$25/жил | Хялбар UI |

**Бүртгэх алхам:**
1. Дээрх вэбсайтуудын аль нэгд бүртгэл үүсгэнэ
2. `medliver.mn` домэйн хайна
3. Монгол иргэний үнэмлэхний мэдээлэл оруулна
4. Төлбөр хийнэ
5. 1-2 хоногийн дотор домэйн идэвхждэг

> `app.medliver.mn` бол `medliver.mn` эзэмшиж байхад Cloudflare дотор **subdomain** нэмэхэд л хангалттай

---

## 4. DNS тохиргоо (Cloudflare)

Cloudflare ашиглах нь — **үнэгүй**, **DDoS хамгаалалттай**, **DNS хурдан**

### Cloudflare тохируулах

1. **cloudflare.com** → нэвтрэх → "Add a Site" → `medliver.mn` оруулна
2. **Free plan** сонгоно
3. Cloudflare 2 nameserver өгнө (жишээ: `ns1.cloudflare.com`, `ns2.cloudflare.com`)
4. Домэйн бүртгэгч рүүгээ буцаж nameserver-ийг солино
5. **DNS Records** хэсэгт дараах бичлэг нэмнэ:

```
Type   Name    Content          Proxy
A      @       <серверийн IP>   ✅ Proxied
A      www     <серверийн IP>   ✅ Proxied
A      app     <серверийн IP>   ✅ Proxied
```

> `app` гэсэн A бичлэг нэмснээр `app.medliver.mn` ажиллана

**Шалгах:**
```bash
# DNS тархсан эсэхийг шалгах (~5-30 минут хүлээх)
nslookup app.medliver.mn
# → серверийн IP буцаах ёстой
```

---

## 5. Серверийн анхны тохиргоо

SSH-р сервер рүү орно:
```bash
ssh root@<СЕРВЕРИЙН_IP>
```

### 5.1 Системийг шинэчлэх

```bash
apt update && apt upgrade -y
apt install -y curl git unzip ufw htop nano gnupg
```

### 5.2 Аюулгүй хэрэглэгч үүсгэх

```bash
# deploy гэдэг хэрэглэгч үүсгэх
adduser deploy
usermod -aG sudo deploy

# SSH key байвал нэмэх (заавал биш)
mkdir -p /home/deploy/.ssh
cp ~/.ssh/authorized_keys /home/deploy/.ssh/
chown -R deploy:deploy /home/deploy/.ssh

# deploy хэрэглэгчээр нэвтрэх
su - deploy
```

### 5.3 Timezone тохируулах

```bash
sudo timedatectl set-timezone Asia/Ulaanbaatar
timedatectl
```

---

## 6. Docker суулгах

```bash
# Docker суулгах
curl -fsSL https://get.docker.com | sudo sh

# deploy хэрэглэгчид Docker эрх өгөх
sudo usermod -aG docker deploy

# Docker Compose plugin шалгах
docker compose version
# → Docker Compose version v2.x.x гарах ёстой

# Шинэ терминал session нээх (group refresh)
newgrp docker
```

---

## 7. MongoDB суулгах ба тохиргоо

MEDLIVER HIS нь MongoDB-г **Docker container** дотор ажиллуулна. Тусдаа суулгах шаардлагагүй — docker-compose.prod.yml дотор автоматаар татаж тохируулдаг.

Гэхдээ MongoDB Shell (`mongosh`) суулгаж байвал сервер дотроос шууд ажиллах боломжтой.

### 7.1 MongoDB Shell суулгах (сервер дотор ашиглах хэрэгсэл)

```bash
# MongoDB GPG key нэмэх
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | \
  sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor

# Repository нэмэх
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] \
  https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | \
  sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list

# Зөвхөн mongosh суулгах (server daemon биш)
sudo apt update
sudo apt install -y mongodb-mongosh
```

### 7.2 Docker MongoDB container тохиргоо

`docker-compose.prod.yml` дотор MongoDB container дараах байдлаар тодорхойлогдсон:

```yaml
mongo:
  image: mongo:7
  container_name: his-mongo
  restart: unless-stopped
  environment:
    MONGO_INITDB_ROOT_USERNAME: ${MONGO_USER}
    MONGO_INITDB_ROOT_PASSWORD: ${MONGO_PASS}
    MONGO_INITDB_DATABASE: hospital_his
  volumes:
    - mongo_data:/data/db
    - ./mongo-init.js:/docker-entrypoint-initdb.d/init.js:ro
  networks:
    - his-net
```

**Анхааруулга:** MongoDB порт `27017` гадна нийтэд нээлгүй — зөвхөн Docker дотоод сүлжээнд (`his-net`) нэвтэрч болно.

### 7.3 MongoDB init script үүсгэх

Анх container дэвших үед дараах init script ажилладаг. Файл байхгүй бол үүсгэнэ:

```bash
cat > /opt/his/mongo-init.js << 'EOF'
// hospital_his database болон application user үүсгэх
db = db.getSiblingDB('hospital_his');

db.createUser({
  user: 'hisapp',
  pwd: process.env.MONGO_PASS,
  roles: [
    { role: 'readWrite', db: 'hospital_his' },
    { role: 'dbAdmin',   db: 'hospital_his' },
  ],
});

// Үндсэн index-үүд
db.patients.createIndex({ patientCode: 1 }, { unique: true });
db.patients.createIndex({ registerNumber: 1 });
db.patients.createIndex({ lastName: 1, firstName: 1 });
db.visits.createIndex({ patientId: 1, visitDate: -1 });
db.appointments.createIndex({ scheduledAt: 1, doctorId: 1 });

print('MongoDB initialized successfully');
EOF
```

### 7.4 Container ажиллуулсны дараа MongoDB шалгах

```bash
# Container дотор mongosh ажиллуулах
docker exec -it his-mongo mongosh \
  -u $MONGO_USER -p $MONGO_PASS \
  --authenticationDatabase admin

# Дотор нэвтэрсний дараа:
show dbs
use hospital_his
show collections
db.stats()
exit
```

### 7.5 MongoDB нэмэлт тохиргоо (performance)

Container дотор MongoDB тохиргооны файлд хандах боломжгүй тул performance-г environment variable-аар удирдана. `docker-compose.prod.yml`-д нэмж болно:

```yaml
mongo:
  ...
  command: >
    mongod
    --wiredTigerCacheSizeGB 4
    --oplogSize 512
    --bind_ip_all
```

> `wiredTigerCacheSizeGB`: RAM-ийн 50% орчим тавих нь зөв. 16GB RAM → 4-6GB

### 7.6 MongoDB хэмжээ хянах

```bash
# Database хэмжээ харах
docker exec -it his-mongo mongosh \
  -u $MONGO_USER -p $MONGO_PASS --authenticationDatabase admin \
  --eval "db.getSiblingDB('hospital_his').stats()" | grep -E "dataSize|storageSize|totalSize"

# Collection тус бүрийн мэдээлэл
docker exec -it his-mongo mongosh \
  -u $MONGO_USER -p $MONGO_PASS --authenticationDatabase admin \
  --eval "
    db = db.getSiblingDB('hospital_his');
    db.getCollectionNames().forEach(c => {
      var s = db[c].stats();
      print(c + ': ' + Math.round(s.size/1024) + 'KB, ' + s.count + ' docs');
    });
  "
```

### 7.7 MongoDB нууц үг өөрчлөх

```bash
docker exec -it his-mongo mongosh \
  -u $MONGO_USER -p $MONGO_PASS --authenticationDatabase admin \
  --eval "
    db.getSiblingDB('admin').updateUser('$MONGO_USER', {
      pwd: 'ШИНЭнууцүг123'
    });
  "

# .env.prod-д шинэ нууц үгийг заавал шинэчлэх!
nano /opt/his/.env.prod
# Дараа нь container дахин эхлүүлэх:
docker restart his-api
```

---

## 8. Код серверт оруулах

### 8.1 Git clone

```bash
# /opt дотор байршуулна
sudo mkdir -p /opt/his
sudo chown deploy:deploy /opt/his
cd /opt/his

git clone https://github.com/yesugdev/new-medliver.git .
```

> GitHub-д private repo бол Personal Access Token ашиглана:  
> `git clone https://<TOKEN>@github.com/yesugdev/new-medliver.git .`

### 8.2 Production .env файл үүсгэх

```bash
cp .env.prod.example .env.prod
nano .env.prod
```

**.env.prod доторх утгуудыг солих:**

```env
# Домэйн (www гүй)
DOMAIN=app.medliver.mn

# MongoDB — аюулгүй нууц үг
MONGO_USER=hisadmin
MONGO_PASS=<30+ тэмдэгт нууц үг>

# JWT — урт санамсаргүй мөр
JWT_SECRET=<50+ тэмдэгт санамсаргүй мөр>

# Анхны admin
SEED_ADMIN_EMAIL=admin@medliver.mn
SEED_ADMIN_PASSWORD=<Хүчтэй нууц үг>
SEED_ADMIN_NAME=Системийн Админ
```

**Аюулгүй нууц үг үүсгэх туслах команд:**
```bash
# MongoDB нууц үг (24 тэмдэгт)
openssl rand -base64 24

# JWT secret (48 тэмдэгт)
openssl rand -base64 48
```

### 8.3 Nginx тохиргоо — домэйн солих

```bash
# nginx/default.conf дотор YOURDOMAIN.mn-г app.medliver.mn-аар солих
sed -i 's/YOURDOMAIN.mn/app.medliver.mn/g' nginx/default.conf

# Шалгах
grep "server_name" nginx/default.conf
# → server_name app.medliver.mn; гарах ёстой
```

---

## 9. SSL сертификат авах

DNS тархсаныг шалгасны дараа SSL авна. Certbot ашиглана.

### 9.1 Certbot суулгах

```bash
sudo apt install -y certbot
```

### 9.2 Nginx-г түр HTTP горимд ажиллуулах

SSL авахын өмнө Nginx-г **зөвхөн HTTP** горимд ажиллуулна.

```bash
# Backup хийх
cp nginx/default.conf nginx/default.conf.bak

# Түр HTTP-only config бичих
cat > nginx/default.conf << 'EOF'
server {
    listen 80;
    server_name app.medliver.mn;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 200 "ok";
    }
}
EOF
```

### 9.3 Nginx container ажиллуулах (SSL авах зориулалтаар)

```bash
# Certbot challenge directory үүсгэх
sudo mkdir -p /var/www/certbot

# Nginx ганцаараа ажиллуулах
docker run -d --name tmp-nginx \
  -p 80:80 \
  -v $(pwd)/nginx/default.conf:/etc/nginx/conf.d/default.conf:ro \
  -v /var/www/certbot:/var/www/certbot \
  nginx:1.25-alpine
```

### 9.4 SSL сертификат авах

```bash
sudo certbot certonly --webroot \
  -w /var/www/certbot \
  -d app.medliver.mn \
  --email admin@medliver.mn \
  --agree-tos \
  --non-interactive
```

**Амжилттай болбол:**
```
Successfully received certificate.
Certificate is saved at: /etc/letsencrypt/live/app.medliver.mn/fullchain.pem
```

### 9.5 Түр Nginx зогсоох

```bash
docker stop tmp-nginx && docker rm tmp-nginx
```

### 9.6 Nginx config-г сэргээх

```bash
cp nginx/default.conf.bak nginx/default.conf
```

### 9.7 SSL автомат шинэчлэл (Cron)

```bash
# SSL сертификат 90 хоног хүчинтэй, автоматаар шинэчлэх
echo "0 3 * * 1 certbot renew --quiet && docker exec his-nginx nginx -s reload" | \
  sudo crontab -
```

---

## 10. Системийг ажиллуулах

```bash
cd /opt/his

# .env.prod файлаас уншиж docker compose ажиллуулах
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --build
```

**Build 5-15 минут үргэлжилнэ.** Дуусахыг хүлээнэ.

### Ажиллаж байгаа эсэхийг шалгах

```bash
# Container-уудын байдал
docker ps

# Логийг харах
docker compose -f docker-compose.prod.yml logs -f

# API ажиллаж байна уу?
curl http://localhost:4000/api/health
# → {"status":"ok"} гарах ёстой

# Вэб ажиллаж байна уу?
curl -I http://localhost:3000
# → HTTP/1.1 200 OK гарах ёстой
```

**Гадаас шалгах:**
```
https://app.medliver.mn        → Нэвтрэх хуудас гарах ёстой
https://app.medliver.mn/api    → NestJS API
```

---

## 11. Анхны өгөгдөл (Seed)

Системийг анх эхлүүлэхэд admin хэрэглэгч үүсгэх хэрэгтэй.

```bash
cd /opt/his

# Seed ажиллуулах (API container дотор)
docker exec his-api node apps/api/dist/seed
```

Seed дуусахад `.env.prod`-д заасан email/нууц үгээр нэвтрэх боломжтой болно:
```
Хаяг:     https://app.medliver.mn
И-мэйл:   admin@medliver.mn
Нууц үг:  <SEED_ADMIN_PASSWORD>
```

---

## 12. Галт хана (Firewall)

```bash
# UFW идэвхжүүлэх
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Зөвшөөрөх порт
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP  (Nginx)
sudo ufw allow 443/tcp   # HTTPS (Nginx)

# MongoDB болон API порт гадна нийтэд НЭЭХГҮЙ
# 27017, 4000, 3000 — Docker internal сүлжээгээр л харилцана

# UFW асаах
sudo ufw enable

# Шалгах
sudo ufw status verbose
```

**Зөв гарц:**
```
22/tcp    ALLOW IN    Anywhere
80/tcp    ALLOW IN    Anywhere
443/tcp   ALLOW IN    Anywhere
```

---

## 13. Өдөр тутмын Backup

### 13.1 Backup скрипт үүсгэх

```bash
sudo nano /opt/backup-his.sh
```

Дараах агуулга оруулна:

```bash
#!/bin/bash
set -e

# Тохиргоо
BACKUP_DIR="/opt/backups/his"
KEEP_DAYS=7
DATE=$(date +%Y-%m-%d_%H-%M)

# .env.prod-аас MongoDB мэдээлэл авах
source /opt/his/.env.prod

# Backup хавтас үүсгэх
mkdir -p "$BACKUP_DIR"

# MongoDB dump
docker exec his-mongo mongodump \
  --username "$MONGO_USER" \
  --password "$MONGO_PASS" \
  --authenticationDatabase admin \
  --db hospital_his \
  --out /tmp/his-backup-$DATE

# Container-аас хост руу хуулах
docker cp his-mongo:/tmp/his-backup-$DATE "$BACKUP_DIR/"

# Container дотор temp файл цэвэрлэх
docker exec his-mongo rm -rf /tmp/his-backup-$DATE

# Хуучин backup устгах (7 хоногоос өмнөх)
find "$BACKUP_DIR" -maxdepth 1 -type d -mtime +$KEEP_DAYS -exec rm -rf {} \;

echo "Backup амжилттай: $BACKUP_DIR/his-backup-$DATE"
```

```bash
# Гүйцэтгэх эрх өгөх
sudo chmod +x /opt/backup-his.sh

# Тест ажиллуулах
sudo /opt/backup-his.sh

# Шалгах
ls -la /opt/backups/his/
```

### 13.2 Cron-д бүртгэх (өдөр бүр шөнийн 2 цагт)

```bash
sudo crontab -e
```

Дараах мөр нэмнэ:
```
0 2 * * * /opt/backup-his.sh >> /var/log/his-backup.log 2>&1
```

### 13.3 Backup-с сэргээх

```bash
# Сэргээх шаардлагатай backup-г сонгох
ls /opt/backups/his/

# Container руу хуулах
docker cp /opt/backups/his/his-backup-2025-06-01_02-00 his-mongo:/tmp/restore

# MongoDB restore
docker exec his-mongo mongorestore \
  --username $MONGO_USER \
  --password $MONGO_PASS \
  --authenticationDatabase admin \
  --db hospital_his \
  /tmp/restore/his-backup-2025-06-01_02-00/hospital_his \
  --drop

echo "Restore дууслаа"
```

---

## 14. Шинэчлэх (Update)

Кодыг шинэчлэх, дахин deploy хийх:

```bash
cd /opt/his

# Шинэ код татах
git pull origin main

# Дахин build хийж ажиллуулах (downtime ~2-3 минут)
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --build

# Хуучин image-уудыг цэвэрлэх
docker image prune -f
```

**Zero-downtime update хийх бол** (production):
```bash
# API, Web тус бүрийг дангаар шинэчлэх
docker compose -f docker-compose.prod.yml --env-file .env.prod \
  up -d --build --no-deps api

docker compose -f docker-compose.prod.yml --env-file .env.prod \
  up -d --build --no-deps web
```

---

## 15. Алдааг засах (Troubleshooting)

### Container ажиллахгүй байна

```bash
# Бүх container-ийн байдал
docker ps -a

# Тодорхой container-ийн лог
docker logs his-api   --tail 100
docker logs his-web   --tail 100
docker logs his-mongo --tail 50
docker logs his-nginx --tail 50
```

### MongoDB холбогдохгүй байна

```bash
# MongoDB container ажиллаж байна уу?
docker ps | grep his-mongo

# Ping шалгах
docker exec -it his-mongo mongosh \
  -u $MONGO_USER -p $MONGO_PASS \
  --authenticationDatabase admin \
  --eval "db.adminCommand({ping:1})"
# → { ok: 1 } гарах ёстой

# API-ийн MongoDB холболтын алдаа харах
docker logs his-api --tail 50 | grep -i mongo
```

### MongoDB replica set эсвэл connection string алдаа

API container-ийн лог-д `MongoServerSelectionError` гарвал:

```bash
# .env.prod-д MONGO_URI зөв эсэх шалгах
docker exec his-api env | grep MONGO

# MongoDB container IP харах
docker inspect his-mongo | grep '"IPAddress"'
```

### SSL сертификат асуудал

```bash
# Сертификатын хугацаа шалгах
sudo certbot certificates

# Гараар шинэчлэх
sudo certbot renew --force-renewal
docker exec his-nginx nginx -s reload
```

### Nginx 502 Bad Gateway

API эсвэл Web container ажиллахгүй байна гэсэн үг:
```bash
docker ps | grep his-api
docker ps | grep his-web
docker logs his-api --tail 50
```

### Дискний зай дүүрэв

```bash
# Дискний зай шалгах
df -h

# Docker хэрэглэж байгаа зай
docker system df

# MongoDB data volume хэмжээ
docker exec his-mongo du -sh /data/db

# Цэвэрлэх (зогссон container, хэрэглэгдэхгүй image)
docker system prune -a -f
```

### API-г дахин эхлүүлэх

```bash
docker restart his-api
docker restart his-web
docker restart his-nginx
```

---

## Системийн мэдээлэл харах

```bash
# Серверийн эрүүл байдал
htop

# Docker container-уудын хэрэглээ
docker stats

# Логийг бодит цагаар харах
docker compose -f docker-compose.prod.yml logs -f --tail 50

# MongoDB холболтын тоо
docker exec -it his-mongo mongosh \
  -u $MONGO_USER -p $MONGO_PASS --authenticationDatabase admin \
  --eval "db.serverStatus().connections"
```

---

## URL-уудын жагсаалт

| Хаяг | Зориулалт |
|---|---|
| `https://app.medliver.mn` | Системийн нэвтрэх хуудас |
| `https://app.medliver.mn/api` | NestJS REST API |
| `https://app.medliver.mn/dashboard` | Хяналтын самбар |
| `https://app.medliver.mn/patients` | Өвчтөний жагсаалт |
| `https://app.medliver.mn/queue` | Өдрийн дараалал |
| `https://app.medliver.mn/appointments` | Цаг захиалга |
| `https://app.medliver.mn/emr/visit` | Үзлэгийн карт |
| `https://app.medliver.mn/profile` | Хэрэглэгчийн профайл |
| `https://app.medliver.mn/settings/print` | Хэвлэх загвар тохиргоо |

---

## Зардлын дүн

| Зүйл | Үнэ/сар |
|---|---|
| Contabo VPS M (Tokyo 8vCPU·16GB·400GB) | $14.99 |
| Contabo Snapshot Backup | $1.99 |
| SSL (Let's Encrypt) | **үнэгүй** |
| Cloudflare DNS + DDoS | **үнэгүй** |
| .mn домэйн (жилийн $25 ÷ 12) | ~$2.08 |
| **Нийт** | **~$19/сар** |

---

*MEDLIVER HIS · Next.js 15 + NestJS 10 + MongoDB 7 · `app.medliver.mn`*
