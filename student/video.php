<html>

<head>
    <style>
    .container {
        position: relative;
        ;
        width: 720px;
        height: 600px;
        border: 1px red solid;
    }

    .toolbox {
        position: absolute;
        bottom: 0px;
        border: 1px red solid;
        width: 100%;
        height: 50px;
    }
    </style>
    <script src="https://code.jquery.com/jquery-3.5.1.min.js"></script>
    <script src="https://139.84.143.251/external_api.js"></script>

    <script>
    $(function() {
        $('#btnStart').on('click', function() {
            StartMeeting();
        });
        $('#btnHangup').on('click', function() {
            HangupCall();
        });
    });

    var apiObj = null;

    function StartMeeting() {
        const domain = '139.84.143.251';

        var roomName = domain + (new Date()).getTime();

        const options = {
            roomName: roomName,
            width: '100%',
            height: '100%',
            parentNode: document.querySelector('#jitsi-meet-conf-container'),
            userInfo: {
                displayName: 'Bilal Shahzad'
            },
            configOverwrite: {},
            interfaceConfigOverwrite: {},
            onload: function() {
                alert('loaded');
            }
        };

        apiObj = new JitsiMeetExternalAPI(domain, options);

        apiObj.addEventListeners({
            readyToClose: function() {
                alert('going to close');
            }
        });

        apiObj.executeCommand('subject', 'New Room 2');

    };

    function HangupCall() {
        apiObj.executeCommand('hangup');
        window.location.href = 'http://192.168.29.47/nayantara/nayantarafrontend/student/dashboard.php'
    }
    </script>
</head>

<body>
    <button id='btnStart'>Start</button>

    <div class="container" style="width: 100%;">
        <div class="toolbox">
            <button id='btnHangup'>Hangup</button>
        </div>
        <div id='jitsi-meet-conf-container'></div>
    </div>
</body>

</html>