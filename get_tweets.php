<?php

require_once('twitter_proxy.php');

// Twitter OAuth Config options
$oauth_access_token = '14260248-s7ta9B0GWaWhP2GmkPZ0aQfouZS3btdKA2TpQ3Dvx';
$oauth_access_token_secret = 'gnpnYmi3kCMcVm7eGtPSd82CsvCozZGXdHh7jMj57xiSv';
$consumer_key = '0b3Sko6Hky0oCOYPCrZv5xG4t';
$consumer_secret = 'kXlAQqNvtGsnCn4kgK6F1sGwUWU3n3oj4ZpA8HVhqBpSn7bbOk';
$user_id = '14260248';
$screen_name = 'enriquebenimeli';
$count = 4;

$twitter_url = 'statuses/user_timeline.json';
$twitter_url .= '?user_id=' . $user_id;
$twitter_url .= '&screen_name=' . $screen_name;
$twitter_url .= '&count=' . $count;

// Create a Twitter Proxy object from our twitter_proxy.php class
$twitter_proxy = new TwitterProxy(
	$oauth_access_token,			// 'Access token' on https://apps.twitter.com
	$oauth_access_token_secret,		// 'Access token secret' on https://apps.twitter.com
	$consumer_key,					// 'API key' on https://apps.twitter.com
	$consumer_secret,				// 'API secret' on https://apps.twitter.com
	$user_id,						// User id (http://gettwitterid.com/)
	$screen_name,					// Twitter handle
	$count							// The number of tweets to pull out
);

// Invoke the get method to retrieve results via a cURL request
$tweets = $twitter_proxy->get($twitter_url);

echo $tweets;

?>