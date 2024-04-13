import { GoogleLogin } from 'react-google-login';

const clientId="541778270792-s8llsorh3ut4fjmvdmjnjv7vttnipndb.apps.googleusercontent.com"
const Login = ({profile})=>{
    const onSuccess = (res) =>{
       console.log ("login success! current user: ",res.profileObj);
       profile(res.profileObj);
    }
    const onFailure = (res) =>{
        console.log ("login Failed! res: ",res);
     }

    return(
        <div id='sign in'>
            <GoogleLogin
                clientId={clientId}
                buttonText="login"
                onSuccess={onSuccess}
                onFailure={onFailure}
                isSignedin={true}
           />
        </div>
    )
}
export default Login;