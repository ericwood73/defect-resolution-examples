import * as THREE from "three"

export default class DeviceOrientationControls {
	scope: any
	object: any
	enabled: any
	deviceOrientation: any
	screenOrientation: any
	alpha: any
	alphaOffsetAngle: any
	betaOffsetAngle: any
	gammaOffsetAngle: any

	constructor(object: any) {
		this.object = object;

		this.object = object;
		this.object.rotation.reorder( "YXZ" );

		this.enabled = true;

		this.deviceOrientation = {};
		this.screenOrientation = 0;

		this.alpha = 0;
		this.alphaOffsetAngle = 0;
		this.betaOffsetAngle = 0;
		this.gammaOffsetAngle = 0;

		this.connect();
	}


	onDeviceOrientationChangeEvent( event: any ) {
		this.deviceOrientation = event;
	};

	onScreenOrientationChangeEvent() {
		this.screenOrientation = window.orientation || 0;
	};
	

	// The angles alpha, beta and gamma form a set of intrinsic Tait-Bryan angles of type Z-X'-Y''

	setObjectQuaternion = function() {

		var zee = new THREE.Vector3( 0, 0, 1 );

		var euler = new THREE.Euler();

		var q0 = new THREE.Quaternion();

		var q1 = new THREE.Quaternion( - Math.sqrt( 0.5 ), 0, 0, Math.sqrt( 0.5 ) ); // - PI/2 around the x-axis

		return function( quaternion: any, alpha: any, beta: any, gamma: any, orient: any ) {

			euler.set( beta, alpha, - gamma, 'YXZ' ); // 'ZXY' for the device, but 'YXZ' for us

			quaternion.setFromEuler( euler ); // orient the device

			quaternion.multiply( q1 ); // camera looks out the back of the device, not the top

			quaternion.multiply( q0.setFromAxisAngle( zee, - orient ) ); // adjust for screen orientation

		};

	}();

	connect() {
		this.onScreenOrientationChangeEvent(); // run once on load

		window.addEventListener( 'orientationchange', this.onScreenOrientationChangeEvent.bind(this), false );
		window.addEventListener( 'deviceorientation', this.onDeviceOrientationChangeEvent.bind(this), false );

		this.enabled = true;
	};

	disconnect() {
		window.removeEventListener( 'orientationchange', this.onScreenOrientationChangeEvent, false );
		window.removeEventListener( 'deviceorientation', this.onDeviceOrientationChangeEvent, false );

		this.enabled = false;
	};

	update() {
		if ( this.enabled === false ) return;

		var alpha = this.deviceOrientation.alpha ? THREE.MathUtils.degToRad( this.deviceOrientation.alpha ) + this.alphaOffsetAngle : 0; // Z
		var beta = this.deviceOrientation.beta ? THREE.MathUtils.degToRad( this.deviceOrientation.beta ) + this.betaOffsetAngle : 0; // X'
		var gamma = this.deviceOrientation.gamma ? THREE.MathUtils.degToRad( this.deviceOrientation.gamma ) + this.gammaOffsetAngle : 0; // Y''
		var orient = this.screenOrientation ? THREE.MathUtils.degToRad( this.screenOrientation ) : 0; // O

		this.setObjectQuaternion( this.object.quaternion, alpha, beta, gamma, orient );
		this.alpha = alpha;
	};

	updateAlphaOffsetAngle( angle: any ) {
		this.alphaOffsetAngle = angle;
		this.update();
	};

	updateBetaOffsetAngle( angle: any ) {
		this.betaOffsetAngle = angle;
		this.update();
	};

	updateGammaOffsetAngle( angle: any ) {
		this.gammaOffsetAngle = angle;
		this.update();
	};

	dispose() {
		this.disconnect(); 
	};
};