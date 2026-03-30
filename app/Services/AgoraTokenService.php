<?php

namespace App\Services;

/**
 * Agora AccessToken2 builder for RTC (audio/video) services.
 *
 * Implements the official AccessToken2 specification:
 * @see https://github.com/AgoraIO/Tools/tree/master/DynamicKey/AgoraDynamicKey
 */
class AgoraTokenService
{
    const VERSION = '007';

    const SERVICE_TYPE_RTC = 1;

    const PRIVILEGE_JOIN_CHANNEL = 1;
    const PRIVILEGE_PUBLISH_AUDIO = 2;
    const PRIVILEGE_PUBLISH_VIDEO = 3;
    const PRIVILEGE_PUBLISH_DATA = 4;

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

        $issueTs = time();
        $salt = random_int(1, 99999999);

        // Build service privileges
        $privileges = [
            self::PRIVILEGE_JOIN_CHANNEL => $privilegeExpireSeconds,
        ];

        if ($isPublisher) {
            $privileges[self::PRIVILEGE_PUBLISH_AUDIO] = $privilegeExpireSeconds;
            $privileges[self::PRIVILEGE_PUBLISH_VIDEO] = $privilegeExpireSeconds;
            $privileges[self::PRIVILEGE_PUBLISH_DATA] = $privilegeExpireSeconds;
        }

        // Pack service data
        $serviceData = self::packUint16(self::SERVICE_TYPE_RTC)
            . self::packString($channelName)
            . self::packString($userAccount)
            . self::packUint16(count($privileges));

        foreach ($privileges as $privType => $privExpire) {
            $serviceData .= self::packUint16($privType) . self::packUint32($privExpire);
        }

        // Build content to sign (for HMAC)
        $signingContent = self::packUint32($issueTs)
            . self::packUint32($tokenExpireSeconds)
            . self::packUint16(1) // 1 service
            . $serviceData;

        // Generate signature
        $signingKey = hash_hmac('sha256', pack('V', $salt), $appCert, true);
        $signature = hash_hmac('sha256', $signingContent, $signingKey, true);

        // Build final token data
        $tokenData = self::packString($appId)
            . self::packUint32($issueTs)
            . self::packUint32($tokenExpireSeconds)
            . self::packUint32($salt)
            . self::packUint16(1) // 1 service
            . $serviceData
            . self::packString($signature);

        return self::VERSION . base64_encode(gzcompress($tokenData));
    }

    private static function packUint16(int $val): string
    {
        return pack('v', $val);
    }

    private static function packUint32(int $val): string
    {
        return pack('V', $val);
    }

    private static function packString(string $str): string
    {
        return pack('v', strlen($str)) . $str;
    }
}
