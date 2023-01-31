<?php
/**
 *------
 * BGA framework: © Gregory Isabelli <gisabelli@boardgamearena.com> & Emmanuel Colin <ecolin@boardgamearena.com>
 * Abyss implementation : © sunil patel <sunil@xikka.com>
 *
 * This code has been produced on the BGA studio platform for use on https://boardgamearena.com.
 * See http://en.doc.boardgamearena.com/Studio for more information.
 * -----
 *
 * abyss.action.php
 *
 * Abyss main action entry point
 *
 *
 * In this file, you are describing all the methods that can be called from your
 * user interface logic (javascript).
 *
 * If you define a method "myAction" here, then you can call it from your javascript code with:
 * this.ajaxcall( "/abyss/abyss/myAction.html", ...)
 *
 */


  class action_abyss extends APP_GameAction
  {
    // Constructor: please do not modify
   	public function __default()
  	{
  	    if( self::isArg( 'notifwindow') )
  	    {
            $this->view = "common_notifwindow";
  	        $this->viewArgs['table'] = self::getArg( "table", AT_posint, true );
  	    }
  	    else
  	    {
            $this->view = "abyss_abyss";
            self::trace( "Complete reinitialization of board game" );
      }
  	}

    public function explore()
    {
        self::setAjaxMode();
        $this->game->explore( );
        self::ajaxResponse( );
    }

    public function purchase() {
        self::setAjaxMode();

        $withNebulis = self::getArg( "withNebulis", AT_posint, false ) ?? 0;

        $this->game->purchase($withNebulis);

        self::ajaxResponse( );
    }

    public function pass()
    {
        self::setAjaxMode();
        $this->game->pass( );
        self::ajaxResponse( );
    }

    public function plot()
    {
        self::setAjaxMode();
        $this->game->plot( );
        self::ajaxResponse( );
    }

    public function exploreTake()
    {
        self::setAjaxMode();
        $slot = self::getArg( "slot", AT_posint, true );
        $this->game->exploreTake( $slot );
        self::ajaxResponse( );
    }

    public function chooseReward()
    {
        self::setAjaxMode();
        $option = self::getArg( "option", AT_posint, true );
        $this->game->chooseReward( $option );
        self::ajaxResponse( );
    }

    public function requestSupport()
    {
        self::setAjaxMode();
        $faction = self::getArg( "faction", AT_posint, true );
        $this->game->requestSupport( $faction );
        self::ajaxResponse( );
    }

    public function recruit()
    {
        self::setAjaxMode();
        $lordId = self::getArg( "lord_id", AT_posint, true );
        $this->game->recruit( $lordId );
        self::ajaxResponse( );
    }

    public function pay() {
        self::setAjaxMode();
        $ally_ids_raw = self::getArg( "ally_ids", AT_numberlist, true );
        if( substr( $ally_ids_raw, -1 ) == ';' )
            $ally_ids_raw = substr( $ally_ids_raw, 0, -1 );
        if( $ally_ids_raw == '' )
            $ally_ids = array();
        else
            $ally_ids = explode( ';', $ally_ids_raw );

        $withNebulis = self::getArg("withNebulis", AT_posint, false) ?? 0;

        $this->game->pay($ally_ids, $withNebulis);

        self::ajaxResponse();
    }

    public function affiliate()
    {
        self::setAjaxMode();
        $ally_id = self::getArg( "ally_id", AT_posint, true );
        $this->game->affiliate( $ally_id );
        self::ajaxResponse( );
    }

    public function discard()
    {
        self::setAjaxMode();
        $ally_ids_raw = self::getArg( "ally_ids", AT_numberlist, true );
        if( substr( $ally_ids_raw, -1 ) == ';' )
            $ally_ids_raw = substr( $ally_ids_raw, 0, -1 );
        if( $ally_ids_raw == '' )
            $ally_ids = array();
        else
            $ally_ids = explode( ';', $ally_ids_raw );
        $this->game->discard( $ally_ids );
        self::ajaxResponse( );
    }

    public function chooseMonsterTokens() {
      self::setAjaxMode();

      $player_id = self::getArg("player_id", AT_posint, true);
      $type = self::getArg("type", AT_posint, false) || 0;
      $this->game->chooseMonsterTokens($player_id, $type);

      self::ajaxResponse();
    }

    public function selectAlly()
    {
        self::setAjaxMode();
        $ally_id = self::getArg( "ally_id", AT_posint, true );
        $this->game->selectAlly( $ally_id );
        self::ajaxResponse( );
    }

    public function selectLord()
    {
        self::setAjaxMode();
        $lord_id = self::getArg( "lord_id", AT_posint, true );
        $this->game->selectLord( $lord_id );
        self::ajaxResponse( );
    }

    public function lordEffect()
    {
        self::setAjaxMode();
        $lord_id = self::getArg( "lord_id", AT_posint, true );
        $this->game->lordEffect( $lord_id );
        self::ajaxResponse( );
    }

    public function drawLocations()
    {
        self::setAjaxMode();
        $num = self::getArg( "num", AT_posint, true );
        $this->game->drawLocations( $num );
        self::ajaxResponse( );
    }

    public function chooseLocation()
    {
        self::setAjaxMode();
        $location_id = self::getArg( "location_id", AT_posint, true );
        $lord_ids_raw = self::getArg( "lord_ids", AT_numberlist, true );
        if( substr( $lord_ids_raw, -1 ) == ';' )
            $lord_ids_raw = substr( $lord_ids_raw, 0, -1 );
        if( $lord_ids_raw == '' )
            $lord_ids = array();
        else
            $lord_ids = explode( ';', $lord_ids_raw );
        $this->game->chooseLocation( $location_id, $lord_ids );
        self::ajaxResponse( );
    }
    
    public function setAutopass()
    {
        self::setAjaxMode();
        $autopass_raw = self::getArg( "autopass", AT_numberlist, true );
        if( substr( $autopass_raw, -1 ) == ';' )
          $autopass_raw = substr( $autopass_raw, 0, -1 );
        if( $autopass_raw == '' )
            $autopass = array();
        else
            $autopass = explode( ';', $autopass_raw );
        $this->game->setAutopass( $autopass );
        self::ajaxResponse( );
    }

    public function payMartialLaw() {
        self::setAjaxMode();

        $this->game->payMartialLaw();

        self::ajaxResponse();
    }

    public function searchSanctuary() {
        self::setAjaxMode();

        $this->game->searchSanctuary();

        self::ajaxResponse();
    }

    public function stopSanctuarySearch() {
        self::setAjaxMode();

        $this->game->stopSanctuarySearch();

        self::ajaxResponse();
    }

    public function freeLord() {
        self::setAjaxMode();

        $id = self::getArg("id", AT_posint, true);

        $this->game->freeLord($id);

        self::ajaxResponse();
    }

    public function selectAllyRace() {
        self::setAjaxMode();

        $faction = self::getArg("faction", AT_posint, true);

        $this->game->selectAllyRace($faction);

        self::ajaxResponse();
    }

    public function takeAllyFromDiscard() {
        self::setAjaxMode();

        $id = self::getArg("id", AT_posint, true);

        $this->game->takeAllyFromDiscard($id);

        self::ajaxResponse();
    }

    public function giveKraken() {
        self::setAjaxMode();

        $playerId = self::getArg("playerId", AT_posint, true);

        $this->game->giveKraken($playerId);

        self::ajaxResponse();
    }

    public function goToPlaceSentinel() {
        self::setAjaxMode();

        $this->game->goToPlaceSentinel();

        self::ajaxResponse();
    }

    public function placeSentinel() {
        self::setAjaxMode();

        $location = self::getArg("location", AT_posint, true);
        $locationArg = self::getArg("locationArg", AT_posint, true);

        $this->game->placeSentinel($location, $locationArg);

        self::ajaxResponse();
    }

    public function giveNebulisTo() {
        self::setAjaxMode();

        $playersIds_raw = self::getArg( "playersIds", AT_numberlist, true );
        if( substr( $playersIds_raw, -1 ) == ';' )
            $playersIds_raw = substr( $playersIds_raw, 0, -1 );
        if( $playersIds_raw == '' )
            $playersIds = array();
        else
            $playersIds = explode( ';', $playersIds_raw );

        $this->game->giveNebulisTo($playersIds);

        self::ajaxResponse( );
    }

    public function placeKraken() {
        self::setAjaxMode();

        $faction = self::getArg("faction", AT_posint, true);

        $this->game->placeKraken($faction);

        self::ajaxResponse();
    }

}
