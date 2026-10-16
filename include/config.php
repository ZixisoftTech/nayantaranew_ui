<?php
/*
 * Environment-aware URLs.
 *
 * In production every page keeps the URL it passes in, so behaviour is unchanged.
 * When served from localhost / 127.0.0.1 (e.g. `php -S localhost:8000`), assets are
 * loaded from the local server and API calls go to the local Node API.
 * Override the local API with the NT_API_URL environment variable if needed.
 */

if (!function_exists('nt_is_local')) {
    function nt_is_local()
    {
        $host = $_SERVER['HTTP_HOST'] ?? '';
        $host = preg_replace('/:\d+$/', '', $host);
        return in_array($host, ['localhost', '127.0.0.1', '::1'], true);
    }

    function nt_base($production)
    {
        if (!nt_is_local()) {
            return $production;
        }
        $scheme = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
        return $scheme . '://' . $_SERVER['HTTP_HOST'];
    }

    function nt_api($production)
    {
        if (!nt_is_local()) {
            return $production;
        }
        return getenv('NT_API_URL') ?: 'http://localhost:8085';
    }
}
