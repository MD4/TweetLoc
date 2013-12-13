<?php
  //============================================================================
  // geotweet.php
  // Ce serveur execute GET une requete de l'API REST de Twitter.
  // L'authentification OAuth est realisee grace aux identifiants et clees
  // secretes d'une application et de son jeton d'acces.
  //
  // Sources :
  //   https://dev.twitter.com/docs/auth/authorizing-request
  //   https://dev.twitter.com/docs/auth/creating-signature
  //
  // Adrien Bougouin
  // adrien.bougouin@univ-nantes.fr
  //============================================================================

  // definition des parametres du serveur
  define("REQUEST_PARAM", "twitter_query"); // URL+arguments de la requete

  // definition des donnees necessaire a l'authentification
  define("CONSUMER_ID", "JoGlpRkZyoDHXrPnOb7PnA");
  define("CONSUMER_SECRET", "hX5CxPAxcmBpCV2Nm1jGjwr5uilMSBqkVSulJlmv5mc");
  define("ACCESS_TOKEN", "2188462572-UaXWyWBlk7ldMKGOJA8xDI7KYHj9I3tBJ43HAag");
  define("ACCESS_TOKEN_SECRET", "nndRwj0ovf0nEGtaIv1IdISc5PJMGzLMHfTLkvqMTin3W");

  // definition de l'adresse du proxy
  define("HTTP_PROXY", "proxyetu.iut-nantes.univ-nantes.prive:3128");
  //define("HTTP_PROXY", "cache.univ-nantes.fr:3128");
  //define("HTTP_PROXY", "");

  /**
   * Cette fonction ordonne les arguments d'une URI dans l'ordre alphabetique.
   * Seuls les arguments sont donnes ici, pas l'URI complete.
   */
  function reorderURIParameters($parameter_string) {
    $splitted_parameters = preg_split("/\&/", $parameter_string);
    $reordered_parameter_string  = "";

    sort($splitted_parameters);

    foreach($splitted_parameters as $index => $param) {
      if($reordered_parameter_string != "") {
        $reordered_parameter_string = $reordered_parameter_string . "&";
      }
      $reordered_parameter_string = $reordered_parameter_string . $param;
    }

    return $reordered_parameter_string;
  }

  if(array_key_exists(REQUEST_PARAM, $_GET)) {
    // preparation de la requete d'authentification
    $query_url_and_param = preg_split("/[?]/", $_GET[REQUEST_PARAM]);
    $query_url = $query_url_and_param[0];
    $query_param = $query_url_and_param[1];
    $oauth_nonce = hash("sha1", rawurlencode($_GET[REQUEST_PARAM]));
    $oauth_timestamp = time();
    $oauth_signature_base_string = "GET"
                                   . "&" . rawurlencode($query_url)
                                   // pour que la signature soit correcte, il
                                   // est imperatif que les argument soient dans
                                   // l'ordre alphabetique
                                   . "&" . rawurlencode(reorderURIParameters("oauth_consumer_key=" . CONSUMER_ID
                                                                             . "&oauth_nonce=" . $oauth_nonce
                                                                             . "&oauth_signature_method=HMAC-SHA1"
                                                                             . "&oauth_timestamp=" . $oauth_timestamp
                                                                             . "&oauth_token=" . ACCESS_TOKEN
                                                                             . "&oauth_version=1.0"
                                                                             . "&" . $query_param));
    $oauth_signing_key = rawurlencode(CONSUMER_SECRET) . "&" . rawurlencode(ACCESS_TOKEN_SECRET);
    $oauth_signature = rawurlencode(base64_encode(hash_hmac("sha1",
                                                         $oauth_signature_base_string,
                                                         $oauth_signing_key,
                                                         TRUE)));

    // envoi des donnees avec la commande curl (cela evite des dependance avec
    // des librairies PHP)
    //exec("curl --get '" . $query_url . "' --data '" . $query_param . "'"
    //     . " --proxy '" . HTTP_PROXY . "'"
    //     . " --header 'Authorization: OAuth"
    //     . " oauth_consumer_key=\"" . CONSUMER_ID . "\","
    //     . " oauth_nonce=\"" . $oauth_nonce . "\","
    //     . " oauth_signature=\"" . $oauth_signature . "\","
    //     . " oauth_signature_method=\"HMAC-SHA1\","
    //     . " oauth_timestamp=\"" . $oauth_timestamp . "\","
    //     . " oauth_token=\"" . ACCESS_TOKEN . "\","
    //     . " oauth_version=\"1.0\"'"
    //     . " --verbose",
    //     $output);
    //echo $output[0];
    $oauth_request = curl_init();
    curl_setopt_array($oauth_request, array(
      CURLOPT_PROXY => HTTP_PROXY,
      CURLOPT_HTTPHEADER => array(
        "Authorization: OAuth"
        . " oauth_consumer_key=\"" . CONSUMER_ID . "\","
        . " oauth_nonce=\"" . $oauth_nonce . "\","
        . " oauth_signature=\"" . $oauth_signature . "\","
        . " oauth_signature_method=\"HMAC-SHA1\","
        . " oauth_timestamp=\"" . $oauth_timestamp . "\","
        . " oauth_token=\"" . ACCESS_TOKEN . "\","
        . " oauth_version=\"1.0\""
      ),
      CURLOPT_HEADER => false,
      CURLOPT_URL => $query_url . "?" . $query_param,
      CURLOPT_RETURNTRANSFER => true,
      CURLOPT_SSL_VERIFYPEER => false
    ));
    echo curl_exec($oauth_request);
    curl_close($oauth_request);
  }
?>
