import React, { useState } from 'react';
import Button from '@material-ui/core/Button';
import { makeStyles, Theme, createStyles } from '@material-ui/core/styles';
import Container from '@material-ui/core/Container';
import Facebook from './Facebook';
import ReCaptcha from "react-google-recaptcha";
import Avatar from '@material-ui/core/Avatar';
import FormControl from '@material-ui/core/FormControl';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import FormHelperText from '@material-ui/core/FormHelperText';
import Checkbox from '@material-ui/core/Checkbox';
import TextField from '@material-ui/core/TextField';
import CircularProgress from '@material-ui/core/CircularProgress';
import LockIcon from '@material-ui/icons/LockOutlined';
import Typography from '@material-ui/core/Typography';
import InputAdornment from '@material-ui/core/InputAdornment';
import IconButton from '@material-ui/core/IconButton';
import Visibility from '@material-ui/icons/Visibility';
import VisibilityOff from '@material-ui/icons/VisibilityOff';
import Slide from '@material-ui/core/Slide';


const useStyles = makeStyles((theme: Theme) => createStyles({
    paper: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
    },
    avatar: {
        margin: theme.spacing(),
        backgroundColor: theme.palette.secondary.main,
        width: 64,
        height: 64
    },
    form: {
        width: '100%', // Fix IE 11 issue.
        marginTop: theme.spacing(),
    },
    submit: {
        marginTop: theme.spacing(3),
    },
    cancel: {
        marginTop: theme.spacing(3),
    },
    reCaptchaContainer: {
        marginTop: theme.spacing(3),
        textAlign: 'center'
    },
    reCaptcha: {
        display: 'inline-block'
    }
}));

const recaptchaRef = React.createRef<ReCaptcha>();

export default function Signin() {
    const classes = useStyles({});
    const [email, setEmail] = useState({ value: '', error: '' });
    const [password, setPassword] = useState({ value: '', error: '', visible: false });
    const [recaptcha2, setRecaptcha2] = useState({ value: '', checked: false, error: '' });

    function switchPasswordVisibility() {
        setPassword(prev => ({ ...prev, visible: !prev.visible }));
    };

    function onLogin(provider: 'facebook' | 'vkontakte') {
        return (token: string) => {
            console.log(provider, token);
        }
    }

    function emailChange(event: React.ChangeEvent<HTMLInputElement>) {
        event.persist();
        setEmail(prev => ({ ...prev, value: event.target.value }));
    }
    function passwordChange(event: React.ChangeEvent<HTMLInputElement>) {
        event.persist();
        setPassword(prev => ({ ...prev, value: event.target.value }));
    }
    function recaptcha2Change(event: React.ChangeEvent<{}>, checked: boolean): void {
        const target = event.target as HTMLInputElement
        if (target.checked) {
            recaptchaRef.current!.execute();
        } else {
            recaptchaRef.current!.reset();
        }
        setRecaptcha2({ checked: target.checked, error: '', value: '' });
    };
    function recaptcha2Confirmed(token: string | null): void {
        setRecaptcha2({
            value: token ?? "",
            checked: true,
            error: "",
        });
    };
    function onFailure(err: string) {
        console.error(err);
    }

    return (
        <Container component="main" maxWidth="xs">
            <div className={classes.paper}>
                <Slide direction="down" in mountOnEnter unmountOnExit>
                    <Avatar className={classes.avatar}>
                        <LockIcon fontSize={'large'} />
                    </Avatar>
                </Slide>
                <form className={classes.form}>
                    <TextField
                        fullWidth
                        autoFocus
                        label="Email address"
                        name={"email"}
                        value={email.value}
                        onChange={emailChange}
                        margin="normal"
                        helperText={email.error}
                        error={!!email.error}
                    />
                    <TextField
                        label="Password"
                        name={"password"}
                        type={password.visible ? 'text' : 'password'}
                        value={password.value}
                        onChange={passwordChange}
                        autoComplete="current-password"
                        margin="normal"
                        fullWidth
                        helperText={password.error}
                        error={!!password.error}
                        InputProps={{
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton
                                        aria-label="Toggle password visibility"
                                        onClick={switchPasswordVisibility}
                                    >
                                        {password.visible ? <Visibility /> : <VisibilityOff />}
                                    </IconButton>
                                </InputAdornment>
                            )
                        }}
                    />
                    <ReCaptcha
                        ref={recaptchaRef}
                        sitekey="6LeionsUAAAAAD_73sJcZxlSa3PhivXpJY25KGhL"
                        size={'invisible'}
                        onChange={recaptcha2Confirmed}
                    />
                    <FormControl required error={!!recaptcha2.error} margin={"normal"}>
                        <FormControlLabel
                            onChange={recaptcha2Change}
                            name={"reCaptchaChecked"}
                            control={<Checkbox
                                color="primary"
                                icon={
                                    recaptcha2.value === '' && recaptcha2.checked
                                        ? <CircularProgress size={24} />
                                        : undefined
                                }
                            />}
                            label="I'm not a robot"
                            checked={recaptcha2.value !== '' && recaptcha2.checked}
                        />
                        <FormHelperText>{recaptcha2.error}</FormHelperText>
                    </FormControl>
                    <Slide direction="up" in mountOnEnter unmountOnExit>
                        <div>
                            <Button
                                type="submit"
                                fullWidth
                                variant="contained"
                                color="primary"
                                className={classes.submit}
                            >
                                Confirm
                        </Button>
                            <Facebook appId={process.env.FACEBOOK_ID!} onLogin={onLogin('facebook')} onFailure={onFailure} />
                        </div>
                    </Slide>
                </form>
            </div>
        </Container>
    );
}