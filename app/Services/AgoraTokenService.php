<?php

namespace App\Services;

/**
 * Agora AccessToken2 token builder for RTC services.
 *
 * Based on official Agora implementation:
 * @see https://github.com/AgoraIO/Tools/tree/master/DynamicKey/AgoraDynamicKey/php/src
 */
class AgoraTokenService
{
    const ROLE_PUBLISHER = 1;
    const ROLE_SUBSCRIBER = 2;

    /**
     * Build a token for a user to join a specific RTC channel.
     */
    public static function buildToken(
        string $channelName,
        string $userAccount,
        int $tokenExpireSeconds = 3600,
        int $privilegeExpireSeconds = 3600,
        bool $isPublisher = true
    ): string {
        $appId = config('services.agora.app_id');
        $appCert = config('services.agora.app_certificate');

        if (!$appId || !$appCert) {
            throw new \RuntimeException('Agora App ID or App Certificate is not configured.');
        }

        if (!AgoraAccessToken2::isUUid($appId)) {
            throw new \RuntimeException('Agora App ID must be a 32-character hex string. Got: "' . $appId . '"');
        }
        if (!AgoraAccessToken2::isUUid($appCert)) {
            throw new \RuntimeException('Agora App Certificate must be a 32-character hex string. Check .env AGORA_APP_CERTIFICATE value.');
        }

        $role = $isPublisher ? self::ROLE_PUBLISHER : self::ROLE_SUBSCRIBER;

        $token = new AgoraAccessToken2($appId, $appCert, $tokenExpireSeconds);
        $serviceRtc = new AgoraServiceRtc($channelName, $userAccount);

        $serviceRtc->addPrivilege(AgoraServiceRtc::PRIVILEGE_JOIN_CHANNEL, $privilegeExpireSeconds);
        if ($role === self::ROLE_PUBLISHER) {
            $serviceRtc->addPrivilege(AgoraServiceRtc::PRIVILEGE_PUBLISH_AUDIO_STREAM, $privilegeExpireSeconds);
            $serviceRtc->addPrivilege(AgoraServiceRtc::PRIVILEGE_PUBLISH_VIDEO_STREAM, $privilegeExpireSeconds);
            $serviceRtc->addPrivilege(AgoraServiceRtc::PRIVILEGE_PUBLISH_DATA_STREAM, $privilegeExpireSeconds);
        }
        $token->addService($serviceRtc);

        return $token->build();
    }
}

/**
 * Internal utility helpers — mirrors official Agora Util.php
 */
class AgoraUtil
{
    public static function packUint16($x)
    {
        return pack("v", $x);
    }

    public static function unpackUint16(&$data)
    {
        $up = unpack("v", substr($data, 0, 2));
        $data = substr($data, 2);
        return $up[1];
    }

    public static function packUint32($x)
    {
        return pack("V", $x);
    }

    public static function unpackUint32(&$data)
    {
        $up = unpack("V", substr($data, 0, 4));
        $data = substr($data, 4);
        return $up[1];
    }

    public static function packString($str)
    {
        return self::packUint16(strlen($str)) . $str;
    }

    public static function unpackString(&$data)
    {
        $len = self::unpackUint16($data);
        $up = unpack("C*", substr($data, 0, $len));
        $data = substr($data, $len);
        return implode(array_map("chr", $up));
    }

    public static function packMapUint32($arr)
    {
        ksort($arr);
        $kv = "";
        foreach ($arr as $key => $val) {
            $kv .= self::packUint16($key) . self::packUint32($val);
        }
        return self::packUint16(count($arr)) . $kv;
    }
}

/**
 * Base service — mirrors official Agora Service class
 */
class AgoraService
{
    public $type;
    public $privileges = [];

    public function __construct($serviceType)
    {
        $this->type = $serviceType;
    }

    public function addPrivilege($privilege, $expire)
    {
        $this->privileges[$privilege] = $expire;
    }

    public function getServiceType()
    {
        return $this->type;
    }

    public function pack()
    {
        return AgoraUtil::packUint16($this->type) . AgoraUtil::packMapUint32($this->privileges);
    }
}

/**
 * RTC service — mirrors official Agora ServiceRtc class
 */
class AgoraServiceRtc extends AgoraService
{
    const SERVICE_TYPE = 1;
    const PRIVILEGE_JOIN_CHANNEL = 1;
    const PRIVILEGE_PUBLISH_AUDIO_STREAM = 2;
    const PRIVILEGE_PUBLISH_VIDEO_STREAM = 3;
    const PRIVILEGE_PUBLISH_DATA_STREAM = 4;

    public $channelName;
    public $uid;

    public function __construct($channelName = "", $uid = "")
    {
        parent::__construct(self::SERVICE_TYPE);
        $this->channelName = $channelName;
        $this->uid = $uid;
    }

    public function pack()
    {
        return parent::pack() . AgoraUtil::packString($this->channelName) . AgoraUtil::packString($this->uid);
    }
}

/**
 * AccessToken2 — mirrors official Agora AccessToken2 class
 */
class AgoraAccessToken2
{
    const VERSION = "007";

    public $appCert;
    public $appId;
    public $expire;
    public $issueTs;
    public $salt;
    public $services = [];

    public function __construct($appId = "", $appCert = "", $expire = 900)
    {
        $this->appId = $appId;
        $this->appCert = $appCert;
        $this->expire = $expire;
        $this->issueTs = time();
        $this->salt = rand(1, 99999999);
    }

    public function addService($service)
    {
        $this->services[$service->getServiceType()] = $service;
    }

    public function build()
    {
        if (!self::isUUid($this->appId) || !self::isUUid($this->appCert)) {
            return "";
        }

        $signing = $this->getSign();
        $data = AgoraUtil::packString($this->appId) . AgoraUtil::packUint32($this->issueTs) . AgoraUtil::packUint32($this->expire)
            . AgoraUtil::packUint32($this->salt) . AgoraUtil::packUint16(count($this->services));

        ksort($this->services);
        foreach ($this->services as $key => $service) {
            $data .= $service->pack();
        }

        $signature = hash_hmac("sha256", $data, $signing, true);

        return self::VERSION . base64_encode(zlib_encode(AgoraUtil::packString($signature) . $data, ZLIB_ENCODING_DEFLATE));
    }

    public function getSign()
    {
        $hh = hash_hmac("sha256", $this->appCert, AgoraUtil::packUint32($this->issueTs), true);
        return hash_hmac("sha256", $hh, AgoraUtil::packUint32($this->salt), true);
    }

    public static function isUUid($str)
    {
        if (strlen($str) != 32) {
            return false;
        }
        return ctype_xdigit($str);
    }
}
