import React from 'react'
import {Segment,Menu} from 'semantic-ui-react'
import {Link} from 'react-router-dom'

function Startbar(props) {

    const handleItemClick = () => {
        console.log("Item Clicked")
    }

    return (
        <div>
            <Segment inverted>
                <Menu inverted pointing secondary>
                <Link to="/">
                    <Menu.Item
                        name='Login'
                        active={props.type === 'login'}
                        onClick={handleItemClick}
                    />
                </Link>
                <Link to="/register">
                    <Menu.Item
                        name='Register'
                        active={props.type === 'register'}
                        onClick={handleItemClick}
                    />
                </Link>
                
                </Menu>
            </Segment>
        </div>
    )
}

export default Startbar
